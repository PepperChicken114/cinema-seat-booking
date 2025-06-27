/**
 * 事件总线接口
 * @interface EventBus
 */
export default class EventBusInterface {
    /**
     * 订阅事件
     * @param {string} event 
     * @param {function(data: any): void} callback 
     */
    on(event, callback) {}
  
    /**
     * 触发事件
     * @param {string} event 
     * @param {any} [data] 
     */
    emit(event, data) {}
  
    /**
     * 取消订阅
     * @param {string} event 
     * @param {function} callback 
     */
    off(event, callback) {}
  }