export interface CreditTransaction {
  id: string;
  type: 'purchase' | 'deduction' | 'refund';
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
  private storageKey: string = 'logoai-credits';

  static getInstance(): CreditService {
    if (!CreditService.instance) {
      CreditService.instance = new CreditService();
    }
    return CreditService.instance;
  }

  private getStorageKey(userId?: string): string {
    return userId ? `${this.storageKey}-${userId}` : this.storageKey;
  }

  private getCreditData(userId?: string): CreditBalance {
    try {
      const key = this.getStorageKey(userId);
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...parsed,
          lastUpdated: new Date(parsed.lastUpdated),
          transactions: parsed.transactions.map((t: any) => ({
            ...t,
            timestamp: new Date(t.timestamp)
          })),
          isNewUser: parsed.isNewUser || false
        };
      }
    } catch (error) {
      console.error('Error loading credit data:', error);
    }

    // Return zero credits for existing users without data
    return {
      balance: 0,
      transactions: [],
      lastUpdated: new Date(),
      isNewUser: false
    };
  }

  private saveCreditData(creditData: CreditBalance, userId?: string): void {
    try {
      const key = this.getStorageKey(userId);
      localStorage.setItem(key, JSON.stringify(creditData));
    } catch (error) {
      console.error('Error saving credit data:', error);
    }
  }

  getCreditBalance(userId?: string): number {
    const data = this.getCreditData(userId);
    return Math.max(0, data.balance);
  }

  // New method to give initial credits only for new accounts
  giveNewUserCredits(userId?: string): boolean {
    try {
      const data = this.getCreditData(userId);
      
      // Only give credits if this is truly a new user (no existing data and no previous credits)
      if (data.balance === 0 && data.transactions.length === 0) {
        const transaction: CreditTransaction = {
          id: crypto.randomUUID(),
          type: 'purchase',
          amount: 1,
          description: 'Welcome bonus - one-time new user credit',
          timestamp: new Date()
        };

        data.balance = 1;
        data.transactions.push(transaction);
        data.lastUpdated = new Date();
        data.isNewUser = true;

        this.saveCreditData(data, userId);
        console.log('New user credits added: 1 credit');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error giving new user credits:', error);
      return false;
    }
  }

  getCreditHistory(userId?: string): CreditTransaction[] {
    const data = this.getCreditData(userId);
    return data.transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  addCredits(amount: number, description: string, userId?: string, stripeSessionId?: string): boolean {
    try {
      const data = this.getCreditData(userId);
      const transaction: CreditTransaction = {
        id: crypto.randomUUID(),
        type: 'purchase',
        amount,
        description,
        timestamp: new Date(),
        stripeSessionId
      };

      data.balance += amount;
      data.transactions.push(transaction);
      data.lastUpdated = new Date();

      this.saveCreditData(data, userId);
      console.log(`Added ${amount} credits. New balance: ${data.balance}`);
      return true;
    } catch (error) {
      console.error('Error adding credits:', error);
      return false;
    }
  }

  deductCredits(amount: number, description: string, userId?: string): boolean {
    try {
      const data = this.getCreditData(userId);
      
      if (data.balance < amount) {
        console.warn(`Insufficient credits. Required: ${amount}, Available: ${data.balance}`);
        return false;
      }

      const transaction: CreditTransaction = {
        id: crypto.randomUUID(),
        type: 'deduction',
        amount,
        description,
        timestamp: new Date()
      };

      data.balance -= amount;
      data.transactions.push(transaction);
      data.lastUpdated = new Date();

      this.saveCreditData(data, userId);
      console.log(`Deducted ${amount} credits. New balance: ${data.balance}`);
      return true;
    } catch (error) {
      console.error('Error deducting credits:', error);
      return false;
    }
  }

  hasEnoughCredits(amount: number, userId?: string): boolean {
    return this.getCreditBalance(userId) >= amount;
  }

  processStripeSuccess(sessionId: string, creditsAmount: number, userId?: string): boolean {
    // Check if this session has already been processed to prevent double-crediting
    const existingTransactions = this.getCreditHistory(userId);
    const alreadyProcessed = existingTransactions.some(
      transaction => transaction.stripeSessionId === sessionId
    );
    
    if (alreadyProcessed) {
      console.log('Session already processed, credits already added:', sessionId);
      return false;
    }
    
    // Determine credits based on common Stripe price points
    const priceToCreditsMap = {
      500: 10,   // $5.00 = 10 credits
      1000: 25,  // $10.00 = 25 credits  
      2000: 55,  // $20.00 = 55 credits
      5000: 150  // $50.00 = 150 credits
    };
    
    // Default credits if not found in map
    const credits = creditsAmount || 25;
    const description = `${credits} credits from subscription purchase`;

    const result = this.addCredits(credits, description, userId, sessionId);
    console.log(`Credit addition result for session ${sessionId}: ${result ? 'SUCCESS' : 'FAILED'}`);
    return result;
  }

  private getProductInfoByCredits(credits: number): { name: string; price: number } | null {
    const products = [
      { credits: 10, name: '10 Credits', price: 5.00 },
      { credits: 25, name: '25 Credits', price: 10.00 },
      { credits: 55, name: '55 Credits', price: 20.00 },
      { credits: 150, name: '150 Credits', price: 50.00 }
    ];
    return products.find(p => p.credits === credits) || null;
  }

  // Migration helper for users who had previous data
  migrateUserCredits(fromUserId: string, toUserId: string): void {
    try {
      const guestData = this.getCreditData();
      const userData = this.getCreditData(toUserId);
      
      // Merge credits and transactions
      userData.balance += guestData.balance;
      userData.transactions = [...userData.transactions, ...guestData.transactions];
      userData.lastUpdated = new Date();
      
      this.saveCreditData(userData, toUserId);
      
      // Clear guest data
      localStorage.removeItem(this.storageKey);
      
      console.log('Successfully migrated credits from guest to user account');
    } catch (error) {
      console.error('Error migrating credits:', error);
    }
  }
}

export const creditService = CreditService.getInstance();