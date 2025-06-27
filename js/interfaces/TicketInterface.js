/**
 * 票务管理接口
 * @interface TicketManager
 */
export class TicketManagerInterface {
    /**
     * 预订座位
     * @param {string[]} seatIds - 座位ID数组
     * @param {Object} userInfo - 用户信息
     * @returns {string} 订单号
     */
    bookSeats(seatIds, userInfo) {}
  
    /**
     * 确认购买
     * @param {string} orderId - 订单号
     * @returns {boolean} 是否成功
     */
    confirmPurchase(orderId) {}
  
    /**
     * 获取座位状态
     * @param {string} seatId 
     * @returns {'vacant'|'selected'|'booked'|'sold'}
     */
    getSeatStatus(seatId) {}
  }