// =======================================================
//  CREDIT SYSTEM — BULLETPROOF VERSION
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
  hasReceivedWelcomeCredit?: boolean;
}

export class CreditService {
  private static instance: CreditService;
  private storageKey: string = "logoai-credits";
  private readonly MAX_CREDITS = 999999;
  private readonly MIN_CREDITS = 0;
  private readonly MAX_TRANSACTION_AMOUNT = 10000;

  static getInstance(): CreditService {
    if (!CreditService.instance) {
      CreditService.instance = new CreditService();
    }
    return CreditService.instance;
  }

  private getStorageKey(userId?: string): string {
    return userId ? `${this.storageKey}-${userId}` : this.storageKey;
  }

  private validateAmount(amount: number, operation: string): void {
    if (typeof amount !== "number" || isNaN(amount)) {
      throw new Error(`Invalid amount for ${operation}: must be a number`);
    }
    if (amount <= 0) {
      throw new Error(`Invalid amount for ${operation}: must be positive`);
    }
    if (amount > this.MAX_TRANSACTION_AMOUNT) {
      throw new Error(`Invalid amount for ${operation}: exceeds maximum (${this.MAX_TRANSACTION_AMOUNT})`);
    }
    if (!Number.isInteger(amount)) {
      throw new Error(`Invalid amount for ${operation}: must be a whole number`);
    }
  }

  private getCreditData(userId?: string): CreditBalance {
    try {
      const key = this.getStorageKey(userId);
      const raw = localStorage.getItem(key);

      if (raw) {
        const parsed = JSON.parse(raw);

        const balance = typeof parsed.balance === "number" ? parsed.balance : 0;
        const transactions = Array.isArray(parsed.transactions) ? parsed.transactions : [];

        const validatedData: CreditBalance = {
          balance: Math.max(this.MIN_CREDITS, Math.min(this.MAX_CREDITS, balance)),
          isNewUser: parsed.isNewUser ?? false,
          hasReceivedWelcomeCredit: parsed.hasReceivedWelcomeCredit ?? false,
          lastUpdated: parsed.lastUpdated ? new Date(parsed.lastUpdated) : new Date(),
          transactions: transactions
            .filter((t: any) => t && typeof t === "object" && t.id && t.amount)
            .map((t: any) => ({
              id: t.id,
              type: t.type || "purchase",
              amount: typeof t.amount === "number" ? t.amount : 0,
              description: t.description || "Transaction",
              timestamp: t.timestamp ? new Date(t.timestamp) : new Date(),
              stripeSessionId: t.stripeSessionId,
            }))
        };

        return validatedData;
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

      const sanitizedData = {
        ...data,
        balance: Math.max(this.MIN_CREDITS, Math.min(this.MAX_CREDITS, data.balance)),
        transactions: data.transactions.slice(-1000)
      };

      localStorage.setItem(key, JSON.stringify(sanitizedData));

      const backupKey = `${key}-backup`;
      localStorage.setItem(backupKey, JSON.stringify({
        ...sanitizedData,
        backupTimestamp: new Date().toISOString()
      }));
    } catch (err) {
      console.error("Error saving credit data:", err);

      try {
        const key = this.getStorageKey(userId);
        const backupKey = `${key}-backup`;
        const backup = localStorage.getItem(backupKey);
        if (backup) {
          localStorage.setItem(key, backup);
          console.log("Restored from backup after save failure");
        }
      } catch (backupErr) {
        console.error("Failed to restore from backup:", backupErr);
      }
    }
  }

  private transactionExists(transactionId: string, userId?: string): boolean {
    const data = this.getCreditData(userId);
    return data.transactions.some(t => t.id === transactionId);
  }

  getCreditBalance(userId?: string): number {
    const data = this.getCreditData(userId);
    return Math.max(0, data.balance);
  }

  getCreditHistory(userId?: string): CreditTransaction[] {
    const data = this.getCreditData(userId);
    return [...data.transactions].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  giveNewUserCredits(userId?: string): boolean {
    try {
      const data = this.getCreditData(userId);

      if (data.hasReceivedWelcomeCredit) {
        console.log("Welcome credit already granted to this user");
        return false;
      }

      const transaction: CreditTransaction = {
        id: `welcome-${crypto.randomUUID()}`,
        type: "purchase",
        amount: 1,
        description: "Welcome bonus - one-time new user credit",
        timestamp: new Date(),
      };

      data.balance += 1;
      data.transactions.push(transaction);
      data.lastUpdated = new Date();
      data.hasReceivedWelcomeCredit = true;

      this.saveCreditData(data, userId);
      console.log("Welcome credit granted: 1 credit");
      return true;
    } catch (err) {
      console.error("Error giving welcome credit:", err);
      return false;
    }
  }

  addCredits(
    amount: number,
    description: string,
    userId?: string,
    stripeSessionId?: string
  ): boolean {
    try {
      this.validateAmount(amount, "add credits");

      const data = this.getCreditData(userId);

      if (data.balance + amount > this.MAX_CREDITS) {
        console.warn(`Cannot add ${amount} credits: would exceed maximum balance`);
        return false;
      }

      const transaction: CreditTransaction = {
        id: stripeSessionId ? `stripe-${stripeSessionId}` : `add-${crypto.randomUUID()}`,
        type: "purchase",
        amount,
        description: description || `${amount} credits added`,
        timestamp: new Date(),
        stripeSessionId,
      };

      if (this.transactionExists(transaction.id, userId)) {
        console.warn(`Transaction ${transaction.id} already exists`);
        return false;
      }

      data.balance += amount;
      data.transactions.push(transaction);
      data.lastUpdated = new Date();

      this.saveCreditData(data, userId);
      console.log(`Added ${amount} credits. New balance: ${data.balance}`);
      return true;
    } catch (err) {
      console.error("Error adding credits:", err);
      return false;
    }
  }

  deductCredits(amount: number, description: string, userId?: string): boolean {
    try {
      this.validateAmount(amount, "deduct credits");

      const data = this.getCreditData(userId);

      if (data.balance < amount) {
        console.warn(`Insufficient credits. Required: ${amount}, Available: ${data.balance}`);
        return false;
      }

      const transaction: CreditTransaction = {
        id: `deduct-${crypto.randomUUID()}`,
        type: "deduction",
        amount,
        description: description || `${amount} credits used`,
        timestamp: new Date(),
      };

      data.balance -= amount;
      data.transactions.push(transaction);
      data.lastUpdated = new Date();

      this.saveCreditData(data, userId);
      console.log(`Deducted ${amount} credits. New balance: ${data.balance}`);
      return true;
    } catch (err) {
      console.error("Error deducting credits:", err);
      return false;
    }
  }

  hasEnoughCredits(amount: number, userId?: string): boolean {
    if (typeof amount !== "number" || amount <= 0) {
      return false;
    }
    return this.getCreditBalance(userId) >= amount;
  }

  processStripeSuccess(
    sessionId: string,
    creditsAmount: number,
    userId?: string
  ): boolean {
    try {
      if (!sessionId || typeof sessionId !== "string") {
        console.error("Invalid session ID");
        return false;
      }

      const history = this.getCreditHistory(userId);
      const alreadyProcessed = history.some(
        (t) => t.stripeSessionId === sessionId || t.id === `stripe-${sessionId}`
      );

      if (alreadyProcessed) {
        console.log("Stripe session already processed:", sessionId);
        return false;
      }

      const description = `${creditsAmount} credits purchased via Stripe`;
      const result = this.addCredits(creditsAmount, description, userId, sessionId);

      if (result) {
        console.log(`Successfully processed Stripe payment: ${creditsAmount} credits added`);
      }

      return result;
    } catch (err) {
      console.error("Error processing Stripe success:", err);
      return false;
    }
  }

  migrateUserCredits(fromUserId: string, toUserId: string): void {
    try {
      if (!fromUserId || !toUserId || fromUserId === toUserId) {
        console.warn("Invalid migration parameters");
        return;
      }

      const guestData = this.getCreditData(fromUserId);
      const userData = this.getCreditData(toUserId);

      if (guestData.balance === 0 && guestData.transactions.length === 0) {
        console.log("No guest data to migrate");
        return;
      }

      userData.balance = Math.min(
        this.MAX_CREDITS,
        userData.balance + guestData.balance
      );

      userData.transactions = [...userData.transactions, ...guestData.transactions];
      userData.lastUpdated = new Date();

      if (guestData.hasReceivedWelcomeCredit && !userData.hasReceivedWelcomeCredit) {
        userData.hasReceivedWelcomeCredit = true;
      }

      this.saveCreditData(userData, toUserId);

      const guestKey = this.getStorageKey(fromUserId);
      localStorage.removeItem(guestKey);
      localStorage.removeItem(`${guestKey}-backup`);

      console.log(`Successfully migrated ${guestData.balance} credits from guest to user account`);
    } catch (err) {
      console.error("Error migrating credits:", err);
    }
  }

  giveCreditsToUser(
    userId: string,
    amount: number,
    description: string = "Admin credit grant"
  ): boolean {
    try {
      if (!userId) {
        console.error("User ID is required");
        return false;
      }

      this.validateAmount(amount, "admin grant");

      const transaction: CreditTransaction = {
        id: `admin-${crypto.randomUUID()}`,
        type: "purchase",
        amount,
        description: description || "Admin credit grant",
        timestamp: new Date(),
      };

      const data = this.getCreditData(userId);

      if (this.transactionExists(transaction.id, userId)) {
        console.warn("Admin transaction already exists");
        return false;
      }

      if (data.balance + amount > this.MAX_CREDITS) {
        console.warn(`Cannot add ${amount} credits: would exceed maximum balance`);
        return false;
      }

      data.balance += amount;
      data.transactions.push(transaction);
      data.lastUpdated = new Date();

      this.saveCreditData(data, userId);
      console.log(`Admin: Added ${amount} credits to user ${userId}. New balance: ${data.balance}`);
      return true;
    } catch (err) {
      console.error("Admin credit error:", err);
      return false;
    }
  }

  refundCredits(amount: number, description: string, userId?: string): boolean {
    try {
      this.validateAmount(amount, "refund credits");

      const data = this.getCreditData(userId);

      if (data.balance + amount > this.MAX_CREDITS) {
        console.warn(`Cannot refund ${amount} credits: would exceed maximum balance`);
        return false;
      }

      const transaction: CreditTransaction = {
        id: `refund-${crypto.randomUUID()}`,
        type: "refund",
        amount,
        description: description || `${amount} credits refunded`,
        timestamp: new Date(),
      };

      data.balance += amount;
      data.transactions.push(transaction);
      data.lastUpdated = new Date();

      this.saveCreditData(data, userId);
      console.log(`Refunded ${amount} credits. New balance: ${data.balance}`);
      return true;
    } catch (err) {
      console.error("Error refunding credits:", err);
      return false;
    }
  }

  resetUserCredits(userId?: string): boolean {
    try {
      const key = this.getStorageKey(userId);
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}-backup`);
      console.log("User credits reset successfully");
      return true;
    } catch (err) {
      console.error("Error resetting credits:", err);
      return false;
    }
  }

  getTotalCreditsEarned(userId?: string): number {
    const history = this.getCreditHistory(userId);
    return history
      .filter(t => t.type === "purchase" || t.type === "refund")
      .reduce((sum, t) => sum + t.amount, 0);
  }

  getTotalCreditsSpent(userId?: string): number {
    const history = this.getCreditHistory(userId);
    return history
      .filter(t => t.type === "deduction")
      .reduce((sum, t) => sum + t.amount, 0);
  }
}

export const creditService = CreditService.getInstance();
