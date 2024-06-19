/**
 * One OrderItemMexal goes through various states.
 * It is created as either ACCEPTED or OBSOLETE, depending
 * on the corresponding Product.
 * Next, ACCEPTED items become forwarded once they have been
 * output to file system. All items end up in an acknowledgement
 * as either ACKNOWLEDGED or REJECTED depending on their initial status.
 *
 * The state transitions are as follows
 *
 * ACCEPTED->FORWARDED->ACKNOWLEDGED
 *
 * OBSOLETE->REJECTED
 */
export enum OrderItemsMexalStatusType {
  /**
   * The item referenced is not obsolete
   */
  ACCEPTED = 1,
  /**
   * The item referenced is obsolete
   */
  OBSOLETE = 2,
  /**
   * The order has been output to Mexal
   */
  FORWARDED = 3,
  /**
   * A positive ack for the item has been created
   * This status is not reached anymore, instead OIMs are deleted
   */
  ACKNOWLEDGED = 4,
  /**
   * A reject response for the item has been created
   * This status is not reached anymore, instead OIMs are deleted
   */
  REJECTED = 5,
}
