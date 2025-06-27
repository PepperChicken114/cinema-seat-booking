/**
 * 选座算法接口
 * @interface SeatAlgorithm
 */
export class SeatAlgorithmInterface {
    /**
     * 自动分配座位
     * @param {Object|Object[]} audience - 单个观众或团体数组
     * @returns {string[]} 分配成功的座位ID数组
     */
    autoAssign(audience) {}
  
    /**
     * 验证手动选座是否合规
     * @param {string[]} seatIds 
     * @param {Object|Object[]} audience 
     * @returns {{
     *   valid: boolean,
     *   message?: string
     * }}
     */
    validateSelection(seatIds, audience) {}
  
    /**
     * 获取允许的排数范围
     * @param {'adult'|'child'|'senior'} type 
     * @returns {number[]}
     */
    getAllowedRows(type) {}
  }