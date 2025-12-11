// =======================================================
//  CREDIT SYSTEM — FINAL OPTIMIZED VERSION (BUG-PROOF)
// =======================================================

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
  hasReceivedWelcomeCredit?: boolean; // NEW permanent flag
}

export class CreditService {
  private static instance: CreditService;
  private storageKey: string = "logoai-credits";

  static getInstance(): CreditService {
    if (!CreditService.instance) {
      CreditService.instance = new CreditService();
    }
    return CreditService.instance;
  }

  // ===========================
  // LOCAL STORAGE HELPERS
  // ===========================

  private getStorageKey(userId?: string): string {
    return userId ? `${this.storageKey}-${userId}` : this.storageKey;
  }

  private getCreditData(userId?: string): CreditBalance {
    try {
      const key = this.getStorageKey(userId);
      const raw = localStorage.getItem(key);

      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          balance: parsed.balance ?? 0,
          isNewUser: parsed.isNewUser ?? false,
          hasReceivedWelcomeCredit: parsed.hasReceivedWelcomeCredit ?? false,
          lastUpdated: new Date(parsed.lastUpdated ?? new Date()),
          transactions: (parsed.transactions ?? []).map((t: any) => ({
            ...t,
            timestamp: new Date(t.timestamp),
          })),
        };
      }
    } catch (err) {
      console.error("Error loading credit data:", err);
    }

    return {
      balance: 0,
      transactions: [],
      lastUpdated: new Date(),
      isNewUser: false,
      hasReceivedWelcomeCredit: false,
    };
  }

  private saveCreditData(data: CreditBalance, userId?: string): void {
    try {
      const key = this.getStorageKey(userId);
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.error("Error saving credit data:", err);
    }
  }

  // ===========================
  // CORE METHODS
  // ===========================

  getCreditBalance(userId?: string): number {
    const data = this.getCreditData(userId);
    return Math.max(0, data.balance);
  }

  getCreditHistory(userId?: string): CreditTransaction[] {
    return this.getCreditData(userId).transactions.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  // ==========================================================
  // ⭐ ONE-TIME WELCOME CREDIT (NEVER AGAIN PER ACCOUNT)
  // ==========================================================

  giveNewUserCredits(userId?: string): boolean {
    try {
      const data = this.getCreditData(userId);

      // Prevent duplicate welcome credits permanently
      if (data.hasReceivedWelcomeCredit) {
        console.log("Welcome credit already granted to this user.");
        return false;
      }

      // First time ever → grant 1 credit
      const transaction: CreditTransaction = {
        id: crypto.randomUUID(),
        type: "purchase",
        amount: 1,
        description: "Welcome bonus - one-time new user credit",
        timestamp: new Date(),
      };

      data.balance += 1;
      data.transactions.push(transaction);
      data.lastUpdated = new Date();

      // Set permanent flag
      data.hasReceivedWelcomeCredit = true;

      this.saveCreditData(data, userId);
      console.log("1 welcome credit granted to new user.");
      return true;
    } catch (err) {
      console.error("Error giving welcome credit:", err);
      return false;
    }
  }

  // ==========================================================
  // ADDING CREDITS
  // ==========================================================

  addCredits(
    amount: number,
    description: string,
    userId?: string,
    stripeSessionId?: string
  ): boolean {
    try {
      const data = this.getCreditData(userId);

      const transaction: CreditTransaction = {
        id: crypto.randomUUID(),
        type: "purchase",
        amount,
        description,
        timestamp: new Date(),
        stripeSessionId,
      };

      data.balance += amount;
      data.transactions.push(transaction);
      data.lastUpdated = new Date();

      this.saveCreditData(data, userId);
      console.log(`Added ${amount} credits.`);
      return true;
    } catch (err) {
      console.error("Error adding credits:", err);
      return false;
    }
  }

  // ==========================================================
  // DEDUCTING CREDITS
  // ==========================================================

  deductCredits(amount: number, description: string, userId?: string): boolean {
    try {
      const data = this.getCreditData(userId);

      if (data.balance < amount) {
        console.warn("Not enough credits.");
        return false;
      }

      const transaction: CreditTransaction = {
        id: crypto.randomUUID(),
        type: "deduction",
        amount,
        description,
        timestamp: new Date(),
      };

      data.balance -= amount;
      data.transactions.push(transaction);
      data.lastUpdated = new Date();

      this.saveCreditData(data, userId);
      return true;
    } catch (err) {
      console.error("Error deducting credits:", err);
      return false;
    }
  }

  hasEnoughCredits(amount: number, userId?: string): boolean {
    return this.getCreditBalance(userId) >= amount;
  }

  // ==========================================================
  // STRIPE SUCCESS HANDLING (PREVENT DOUBLE CREDIT)
  // ==========================================================

  processStripeSuccess(
    sessionId: string,
    creditsAmount: number,
    userId?: string
  ): boolean {
    const history = this.getCreditHistory(userId);

    const alreadyProcessed = history.some(
      (t) => t.stripeSessionId === sessionId
    );

    if (alreadyProcessed) {
      console.log("Stripe session already processed:", sessionId);
      return false;
    }

    const description = `${creditsAmount} credits purchased`;
    return this.addCredits(creditsAmount, description, userId, sessionId);
  }

  // ==========================================================
  // USER MIGRATION (GUEST → REGISTERED ACCOUNT)
  // ==========================================================

  migrateUserCredits(fromUserId: string, toUserId: string): void {
    try {
      const guest = this.getCreditData(fromUserId);
      const user = this.getCreditData(toUserId);

      user.balance += guest.balance;
      user.transactions.push(...guest.transactions);
      user.lastUpdated = new Date();

      // preserve welcome credit flag
      if (guest.hasReceivedWelcomeCredit) {
        user.hasReceivedWelcomeCredit = true;
      }

      this.saveCreditData(user, toUserId);

      // clear guest data
      localStorage.removeItem(this.getStorageKey(fromUserId));

      console.log("Credits migrated successfully.");
    } catch (err) {
      console.error("Error migrating credits:", err);
    }
  }

  // ==========================================================
  // ADMIN CREDIT GRANTING
  // ==========================================================

  giveCreditsToUser(
    userId: string,
    amount: number,
    description: string = "Admin credit grant"
  ): boolean {
    try {
      return this.addCredits(amount, description, userId);
    } catch (err) {
      console.error("Admin credit error:", err);
      return false;
    }
  }
}

export const creditService = CreditService.getInstance();
