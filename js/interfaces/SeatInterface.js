/**
 * 座位基础数据接口
 * @interface Seat
 */
export class SeatInterface {
    /**
     * 标准座位结构
     * @type {Object}
     * @property {string} id - 座位唯一ID (格式: "R{row}C{col}")
     * @property {number} row - 排号 (1-10)
     * @property {number} col - 列号 (1-20)
     * @property {'vacant'|'selected'|'booked'|'sold'} status - 座位状态
     * @property {number} price - 票价
     */
    static get SEAT_SCHEMA() {
      return {
        id: '',
        row: 0,
        col: 0,
        status: 'vacant',
        price: 35
      };
    }
  
    /**
     * 座位状态枚举
     * @enum {string}
     */
    static get SEAT_STATUS() {
      return {
        VACANT: 'vacant',
        SELECTED: 'selected',
        BOOKED: 'booked',
        SOLD: 'sold'
      };
    }
  }
  
  /**
   * 绘图模块接口
   * @interface SeatRenderer
   */
  export class SeatRendererInterface {
    /**
     * 初始化影院视图
     * @param {HTMLCanvasElement} canvas 
     * @param {Object} config - 影院配置
     */
    constructor(canvas, config) {}
  
    /**
     * 更新座位显示
     * @param {Seat[]} seats - 需要更新的座位数组
     */
    updateSeats(seats) {}
  
    /**
     * 注册座位点击回调
     * @param {function(seatId: string, event: MouseEvent): void} callback
     */
    onSeatClick(callback) {}
  }