import { LunchFlowTransaction, ActualBudgetTransaction, AccountMapping } from './types';

export class TransactionMapper {
  private accountMappings: AccountMapping[];

  constructor(accountMappings: AccountMapping[]) {
    this.accountMappings = accountMappings;
  }

  /**
   * Generate a deterministic synthetic ID for pending transactions without an ID.
   * Uses account, date, amount, and merchant to create a unique identifier.
   */
  private generateSyntheticId(lfTransaction: LunchFlowTransaction): string {
    const amountCents = Math.round(lfTransaction.amount * 100);
    const merchantSlug = lfTransaction.merchant
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
    return `lf_pending_${lfTransaction.accountId}_${lfTransaction.date}_${amountCents}_${merchantSlug}`;
  }

  mapTransaction(lfTransaction: LunchFlowTransaction): ActualBudgetTransaction | null {
    const mapping = this.accountMappings.find(
      m => m.lunchFlowAccountId === lfTransaction.accountId
    );

    if (!mapping) {
      console.warn(`No mapping found for Lunch Flow account ${lfTransaction.accountId}`);
      return null;
    }

    if (lfTransaction.merchant == null || lfTransaction.merchant.trim() === '') {
      console.warn(`Found transaction ${lfTransaction.id} with empty merchant`);
      if (lfTransaction.amount < 0 && mapping.merchantFromDescriptionRegex?.pattern) {
        console.warn(`Will attempt to extract merchant from description using regex ${mapping.merchantFromDescriptionRegex.pattern}`);
        try {
          const regex = new RegExp(
            mapping.merchantFromDescriptionRegex.pattern,
            mapping.merchantFromDescriptionRegex.flags
          );
          lfTransaction.merchant = lfTransaction.description.match(regex)?.[1]?.trim() ?? '';
        } catch (error: any) {
          console.warn(`Invalid regex pattern in mapping: ${error.message}`);
          lfTransaction.merchant = '';
        }
      }
    }

    const isPending = lfTransaction.isPending === true;

    return {
      date: lfTransaction.date,
      // Forcing to fixed point integer to avoid floating point precision issues
      amount: parseInt((lfTransaction.amount * 100).toFixed(0)),
      payee_name: lfTransaction.merchant,
      imported_payee: lfTransaction.merchant,
      account: mapping.actualBudgetAccountId,
      cleared: !isPending, // false for pending, true for posted
      notes: isPending ? `[PENDING] ${lfTransaction.description}` : lfTransaction.description,
      imported_id: isPending ? this.generateSyntheticId(lfTransaction) : `lf_${lfTransaction.id}`,
      isPending: isPending, // Track pending status for UI display
    };
  }

  mapTransactions(lfTransactions: LunchFlowTransaction[]): ActualBudgetTransaction[] {
    return lfTransactions
      .map(t => this.mapTransaction(t))
      .filter((t): t is ActualBudgetTransaction => t !== null);
  }
}
