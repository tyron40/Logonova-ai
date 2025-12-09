export interface CreditTransaction {
  id: string;
  type: "purchase" | "deduction" | "refund";
  amount: number;
  description: string;
  timestamp: Date;
  stripeSessionId?: string;
}

export interface CreditBalance {
  balance: number;
  transactions: CreditTransaction[];
  lastUpdated: Date;
  isNewUser: boolean;
}

export class CreditService {
  private static instance: CreditService;
  private storageKey = "logoai-credits";

  static getInstance(): CreditService {
    if (!CreditService.instance) {
      CreditService.instance = new CreditService();
    }
    return CreditService.instance;
  }

  private getStorageKey(userId?: string): string {
    return userId ? `${this.storageKey}-${userId}` : this.storageKey;
  }

  // ----------------------------------------------------
  // SAFE LOAD
  // ----------------------------------------------------
  private getCreditData(userId?: string): CreditBalance {
    try {
      const key = this.getStorageKey(userId);
      const raw = localStorage.getItem(key);

      if (!raw) {
        return this.emptyCreditState();
      }

      const parsed = JSON.parse(raw);

      // Validate structure
      if (
        typeof parsed.balance !== "number" ||
        !Array.isArray(parsed.transactions)
      ) {
        console.warn("Invalid credit structure detected → Resetting.");
        return this.emptyCreditState();
      }

      return {
        balance: Math.max(0, parsed.balance),
        transactions: parsed.transactions.map((t: any) => ({
          ...t,
          timestamp: new Date(t.timestamp),
        })),
        lastUpdated: new Date(parsed.lastUpdated ?? new Date()),
        isNewUser: !!parsed.isNewUser,
      };
    } catch (err) {
      console.error("Error loading credit data:", err);
      return this.emptyCreditState();
    }
  }

  private emptyCreditState(): CreditBalance {
    return {
      balance: 0,
      transactions: [],
      lastUpdated: new Date(),
      isNewUser: false,
    };
  }

  // ----------------------------------------------------
  // SAFE SAVE
  // ----------------------------------------------------
  private saveCreditData(data: CreditBalance, userId?: string): void {
    try {
      const key = this.getStorageKey(userId);

      // Ensure no broken values
      data.balance = Math.max(0, data.balance);

      localStorage.setItem(
        key,
        JSON.stringify({
          ...data,
          lastUpdated: new Date().toISOString(),
          transactions: data.transactions.map((t) => ({
            ...t,
            timestamp: t.timestamp.toISOString(),
          })),
        })
      );
    } catch (err) {
      console.error("Error saving credit data:", err);
    }
  }

  // ----------------------------------------------------
  // PUBLIC GETTERS
  // ----------------------------------------------------
  getCreditBalance(userId?: string): number {
    return this.getCreditData(userId).balance;
  }

  getCreditHistory(userId?: string): CreditTransaction[] {
    return this.getCreditData(userId).transactions.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  hasEnoughCredits(amount: number, userId?: string): boolean {
    return this.getCreditBalance(userId) >= amount;
  }

  // ----------------------------------------------------
  // NEW USER BONUS
  // ----------------------------------------------------
  giveNewUserCredits(userId?: string): boolean {
    try {
      const data = this.getCreditData(userId);

      // Only give when absolutely new
      if (data.transactions.length === 0 && data.balance === 0) {
        const tx: CreditTransaction = {
          id: crypto.randomUUID(),
          type: "purchase",
          amount: 1,
          description: "Welcome bonus - new user credit",
          timestamp: new Date(),
        };

        data.balance = 1;
        data.transactions.push(tx);
        data.isNewUser = true;

        this.saveCreditData(data, userId);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error giving new user credits:", err);
      return false;
    }
  }

  // ----------------------------------------------------
  // ADD CREDITS
  // ----------------------------------------------------
  addCredits(
    amount: number,
    description: string,
    userId?: string,
    stripeSessionId?: string
  ): boolean {
    try {
      if (amount <= 0) return false;

      const data = this.getCreditData(userId);

      const tx: CreditTransaction = {
        id: crypto.randomUUID(),
        type: "purchase",
        amount,
        description,
        timestamp: new Date(),
        stripeSessionId,
      };

      data.balance += amount;
      data.transactions.push(tx);
      data.lastUpdated = new Date();

      this.saveCreditData(data, userId);
      return true;
    } catch (err) {
      console.error("Error adding credits:", err);
      return false;
    }
  }

  // ----------------------------------------------------
  // DEDUCT CREDITS
  // ----------------------------------------------------
  deductCredits(amount: number, description: string, userId?: string): boolean {
    try {
      const data = this.getCreditData(userId);

      if (amount <= 0 || data.balance < amount) {
        console.warn("Not enough credits.");
        return false;
      }

      const tx: CreditTransaction = {
        id: crypto.randomUUID(),
        type: "deduction",
        amount,
        description,
        timestamp: new Date(),
      };

      data.balance -= amount;
      data.transactions.push(tx);
      data.lastUpdated = new Date();

      this.saveCreditData(data, userId);
      return true;
    } catch (err) {
      console.error("Error deducting credits:", err);
      return false;
    }
  }

  // ----------------------------------------------------
  // STRIPE SUCCESS HANDLING
  // ----------------------------------------------------
  processStripeSuccess(
    sessionId: string,
    creditsAmount: number,
    userId?: string
  ): boolean {
    const history = this.getCreditHistory(userId);

    // Prevent double processing
    if (history.some((t) => t.stripeSessionId === sessionId)) {
      console.log("Stripe session already processed.");
      return false;
    }

    const finalCredits =
      creditsAmount > 0 ? creditsAmount : this.mapPriceToCredits(creditsAmount);

    return this.addCredits(
      finalCredits,
      `${finalCredits} credits purchased`,
      userId,
      sessionId
    );
  }

  private mapPriceToCredits(amount: number): number {
    const priceToCredits: Record<number, number> = {
      500: 10,
      1000: 25,
      2000: 55,
      5000: 150,
    };

    return priceToCredits[amount] ?? 25;
  }

  // ----------------------------------------------------
  // USER MIGRATION (guest → logged-in)
  // ----------------------------------------------------
  migrateUserCredits(fromUserId: string, toUserId: string): void {
    try {
      const guest = this.getCreditData(fromUserId);
      const user = this.getCreditData(toUserId);

      user.balance += guest.balance;
      user.transactions.push(...guest.transactions);
      user.lastUpdated = new Date();

      this.saveCreditData(user, toUserId);

      localStorage.removeItem(this.getStorageKey(fromUserId));
    } catch (err) {
      console.error("Error migrating credits:", err);
    }
  }

  // ----------------------------------------------------
  // ADMIN CREDIT GRANT
  // ----------------------------------------------------
  giveCreditsToUser(
    userId: string,
    amount: number,
    description = "Admin credit grant"
  ): boolean {
    try {
      const data = this.getCreditData(userId);

      const tx: CreditTransaction = {
        id: crypto.randomUUID(),
        type: "purchase",
        amount,
        description,
        timestamp: new Date(),
      };

      data.balance += amount;
      data.transactions.push(tx);
      data.lastUpdated = new Date();

      this.saveCreditData(data, userId);
      return true;
    } catch (err) {
      console.error("Error giving admin credits:", err);
      return false;
    }
  }
}

export const creditService = CreditService.getInstance();
