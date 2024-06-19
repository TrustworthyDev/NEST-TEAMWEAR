export enum InvoiceStatusType {
  /**
   * The invoice is a draft, not yet issued.
   */
  DRAFT = 1,

  /**
   * The invoice is issued. It mustn't be changed.
   */
  ISSUED = 2,

  /**
   * The invoice is forwarded. It has been sent to the partner.
   */
  FORWARDED = 3,
}
