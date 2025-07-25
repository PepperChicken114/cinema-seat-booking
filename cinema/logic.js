document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('cinemaCanvas');
    const ctx = canvas.getContext('2d');

    // 影院配置 -动态配置
    const config = {
        capacity: 400, // 默认400座
        seatsPerRow: 20, // 固定每排20座
        get rows() { return this.capacity / this.seatsPerRow; }, // 动态计算行数
        reservedSeats: ['1-1', '1-2', '1-10', '1-20',
            '2-5', '2-15',
            '3-7', '3-8', '3-9',
            '4-1', '4-20',
            '5-10', '5-11',
            '6-5', '6-6', '6-15', '6-16',
            '7-1', '7-20',
            '8-10',
            '9-5', '9-15',
            '10-1', '10-2', '10-19', '10-20'],
        ticketPrice: 50
    };

   
    const state = {
        selectedSeats: [],
        reservedSeats: [...config.reservedSeats],
        groupMembers: [],
        seats: [],
        allBookings: new Map(), // 所有订单：key: bookingId, value: booking
        currentBookingId: null, // 当前显示的订单ID
        individualBookings: new Map(), // 个人票订单：key: customerName, value: bookingId
        isNewBookingMode: true // 是否在新订单模式
    };

    // 获取DOM元素
    const elements = {
        ticketType: document.getElementById('ticketType'),
        individualForm: document.getElementById('individualForm'),
        groupForm: document.getElementById('groupForm'),
        groupSize: document.getElementById('groupSize'),
        addMembersBtn: document.getElementById('addMembersBtn'),
        groupMembers: document.getElementById('groupMembers'),
        individualName: document.getElementById('individualName'),
        individualAge: document.getElementById('individualAge'),
        autoSelectBtn: document.getElementById('autoSelectBtn'),
        manualSelectBtn: document.getElementById('manualSelectBtn'),
        resetBtn: document.getElementById('resetBtn'),
        errorMsg: document.getElementById('errorMsg'),
        ticketInfo: document.getElementById('ticketInfo'),
        ticketDetails: document.getElementById('ticketDetails'),
        confirmBtn: document.getElementById('confirmBtn'),
        reserveBtn: document.getElementById('reserveBtn'),
        purchaseBtn: document.getElementById('purchaseBtn'),
        payBtn: document.getElementById('payBtn'),
        cancelBtn: document.getElementById('cancelBtn'),
        refundBtn: document.getElementById('refundBtn'),
        ticketStatus: document.getElementById('ticketStatus'),
        statusDetails: document.getElementById('statusDetails'),
        toggleHistoryBtn: document.getElementById('toggleHistoryBtn'),
        closeHistoryBtn: document.getElementById('closeHistoryBtn'),
        orderHistory: document.getElementById('orderHistory'),
        historyList: document.getElementById('historyList'),
        statusFilter: document.getElementById('statusFilter'),
        typeFilter: document.getElementById('typeFilter'),
        cinemaCapacity: document.getElementById('cinemaCapacity'),
        applyCinemaBtn: document.getElementById('applyCinemaBtn'),
        currentCapacity: document.getElementById('currentCapacity'),
        currentRows: document.getElementById('currentRows')
    };

    
    function applyCinemaConfig() {
        const capacity = parseInt(elements.cinemaCapacity.value);
        
        // 验证输入
        if (!capacity || capacity < 100 || capacity > 500) {
            showError('请输入100-500之间的座位数');
            return;
        }
        
        if (capacity % 20 !== 0) {
            showError('座位数必须是20的整数倍');
            return;
        }
        
        // 检查是否有活跃订单
        if (state.allBookings.size > 0) {
            if (!confirm('更改影院配置将清空所有订单，确定要继续吗？')) {
                return;
            }
        }
        
        // 更新配置
        config.capacity = capacity;
        
        // 重置所有状态
        state.selectedSeats = [];
        state.reservedSeats = [...config.reservedSeats];
        state.allBookings.clear();
        state.currentBookingId = null;
        state.individualBookings.clear();
        state.isNewBookingMode = true;
        state.groupMembers = [];
        
        // 清空表单
        elements.individualName.value = '';
        elements.individualAge.value = '';
        elements.groupSize.value = '';
        elements.groupMembers.innerHTML = '';
        
        // 更新显示
        updateCapacityDisplay();
        
        // 重新初始化
        resizeCanvas();
        updateOperationButtons();
        updateTicketStatus();
        elements.ticketInfo.style.display = 'none';
        hideOrderHistory();
        clearError();
        
        showError(`影院配置已更新：${capacity}座 (${config.rows}排 × 20座)`, 'success');
    }

    
    function updateCapacityDisplay() {
        elements.currentCapacity.textContent = config.capacity;
        elements.currentRows.textContent = config.rows;
    }

    function resizeCanvas() {
        const container = document.querySelector('.seat-canvas-container');
        const canvas = document.getElementById('cinemaCanvas');
        const ctx = canvas.getContext('2d');
    
        if (!container) return;
    
        // 获取设备像素比（通常 1 或 2，Retina 屏为 2）
        const dpr = window.devicePixelRatio || 1;
    
        // 1. 设置 canvas 的 CSS 尺寸（逻辑像素）
        const logicalWidth = container.clientWidth - 20;
        const baseHeight = 120;
        const rowHeight = 45;
        const bottomPadding = 50;
        const calculatedHeight = baseHeight + (config.rows * rowHeight) + bottomPadding;
    
        canvas.style.width = `${logicalWidth}px`;
        canvas.style.height = `${calculatedHeight}px`;
    
        // 2. 设置 canvas 的实际像素尺寸（物理像素）
        canvas.width = logicalWidth * dpr;
        canvas.height = calculatedHeight * dpr;
    
        // 3. 缩放绘图上下文，避免内容变形
        ctx.scale(dpr, dpr);
    
        initializeSeats();
        drawSeatMap();
    }
    resizeCanvas();

    window.addEventListener('resize', resizeCanvas);
    function initializeSeats() {
        state.seats = [];
        const dpr = window.devicePixelRatio || 1;
        const centerX = (canvas.width /dpr) /2;
        const startY = 80;
        const rowSpacing = 45;

        for (let row = 1; row <= config.rows; row++) {
            const rowSeats = [];
            const rowY = startY + (row - 1) * rowSpacing;

            // 计算弧形参数 - 确保在大行数时也能正常显示
            const curveFactor = (row - 1) / Math.max(config.rows - 1, 1);
            const baseWidth = 300;
            const maxWidth = Math.min(500, canvas.width * 0.8); // 限制最大宽度
            const rowWidth = baseWidth + (maxWidth - baseWidth) * curveFactor;

            // 弧形高度适应行数
            const arcHeight = Math.max(10, 15 + row * 2); // 减少弧形高度增长

            for (let seatNum = 1; seatNum <= config.seatsPerRow; seatNum++) {
                const seatSpacing = rowWidth / Math.max(config.seatsPerRow - 1, 1);
                const linearX = centerX - rowWidth / 2 + (seatNum - 1) * seatSpacing;

                const normalizedX = (linearX - centerX) / (rowWidth / 2);
                const yOffset = arcHeight * (1 - normalizedX * normalizedX);

                const x = linearX;
                const y = rowY + yOffset;

                const seatId = `${row}-${seatNum}`;
                const isReserved = state.reservedSeats.includes(seatId);

                rowSeats.push({
                    id: seatId,
                    row: row,
                    number: seatNum,
                    x: x,
                    y: y,
                    isReserved: isReserved,
                    radius: 8
                });
            }
            state.seats.push(rowSeats);
        }
    }

    function handleSeatClick(event) {
        const isCtrlPressed = event.ctrlKey || event.metaKey;
        if (!state.isNewBookingMode) {
            showError('请先完成当前订单处理或切换到新订单模式');
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        // 获取Canvas的实际尺寸和显示尺寸
        const scaleX = (canvas.width/dpr) / rect.width;
        const scaleY = (canvas.height/dpr) / rect.height;
        
        // 计算鼠标在Canvas坐标系中的位置
        const mouseX = (event.clientX - rect.left) * scaleX;
        const mouseY = (event.clientY - rect.top) * scaleY;

        let clickedSeat = null;

        state.seats.forEach(rowSeats => {
            rowSeats.forEach(seat => {
                const distance = Math.sqrt(
                    Math.pow(mouseX - seat.x, 2) +
                    Math.pow(mouseY - seat.y, 2)
                );

                if (distance <= seat.radius && isSeatAvailable(seat.id)) {
                    clickedSeat = seat;
                }
            });
        });

        if (clickedSeat) {
            if (elements.ticketType.value === 'individual') {
                const customerName = elements.individualName.value.trim();
                if (customerName && hasActiveIndividualBooking(customerName)) {
                    showError(`客户 ${customerName} 已有一个活跃的个人票订单`);
                    return;
                }
            }

            const ticketType = elements.ticketType.value;

            if (ticketType === 'individual') {
                if (state.selectedSeats.includes(clickedSeat.id)) {
                    state.selectedSeats = [];
                } else {
                    state.selectedSeats = [clickedSeat.id];
                }
            } else {
                const index = state.selectedSeats.indexOf(clickedSeat.id);
                if (isCtrlPressed){
                    // Ctrl+点击：切换选中状态
                    if (index === -1) {
                        state.selectedSeats.push(clickedSeat.id);
                    } else {
                        state.selectedSeats.splice(index, 1);
                    }
                }
                else {
                    // 普通点击：重置为当前点击的座位
                    state.selectedSeats = [clickedSeat.id];
                }
            }

            drawSeatMap();
            updateTicketInfo();
            updateOperationButtons();
        }
    }

    function isSeatAvailable(seatId) {
        if (state.reservedSeats.includes(seatId)) {
            return false;
        }

        for (let booking of state.allBookings.values()) {
            if (booking.seats.includes(seatId)) {
                return false;
            }
        }

        return true;
    }

    function hasActiveIndividualBooking(customerName) {
        if (!customerName) return false;

        const bookingId = state.individualBookings.get(customerName);
        if (!bookingId) return false;

        const booking = state.allBookings.get(bookingId);
        return booking && (booking.status === 'reserved' || booking.status === 'paid');
    }

    function getAllOccupiedSeats() {
        let occupiedSeats = [...state.reservedSeats];

        for (let booking of state.allBookings.values()) {
            occupiedSeats.push(...booking.seats);
        }

        return occupiedSeats;
    }

    function drawSeatMap() {
        const dpr = window.devicePixelRatio || 1;
        const logicalWidth = canvas.width / dpr;  // 逻辑像素宽度
        const logicalHeight = canvas.height / dpr;  // 逻辑像素高度
        ctx.clearRect(0, 0, logicalWidth, logicalHeight);
        const screenWidth = Math.min(logicalWidth * 0.8, 500);
        const screenX = (logicalWidth - screenWidth) / 2;
        const screenY = 20;
        const screenHeight = 30;

        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(screenX, screenY, screenWidth, screenHeight);

        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX, screenY, screenWidth, screenHeight);

        const gradient = ctx.createLinearGradient(screenX, screenY, screenX, screenY + screenHeight);
        gradient.addColorStop(0, '#444');
        gradient.addColorStop(1, '#000');
        ctx.fillStyle = gradient;
        ctx.fillRect(screenX, screenY, screenWidth, screenHeight);

        ctx.fillStyle = '#fff';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('银幕', logicalWidth / 2, screenY + screenHeight / 2);

        state.seats.forEach(rowSeats => {
            rowSeats.forEach(seat => {
                ctx.beginPath();
                ctx.arc(seat.x, seat.y, seat.radius, 0, Math.PI * 2);

                if (state.selectedSeats.includes(seat.id)) {
                    ctx.fillStyle = '#FFEB3B';
                } else if (seat.isReserved) {
                    ctx.fillStyle = '#F44336';
                } else {
                    let isOccupied = false;
                    let bookingStatus = null;

                    for (let booking of state.allBookings.values()) {
                        if (booking.seats.includes(seat.id)) {
                            isOccupied = true;
                            bookingStatus = booking.status;
                            break;
                        }
                    }

                    if (isOccupied) {
                        if (bookingStatus === 'reserved') {
                            ctx.fillStyle = '#FF9800';
                        } else if (bookingStatus === 'paid') {
                            ctx.fillStyle = '#F44336';
                        } else {
                            ctx.fillStyle = '#4CAF50';
                        }
                    } else {
                        ctx.fillStyle = '#4CAF50';
                    }
                }

                ctx.fill();
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 1;
                ctx.stroke();

                // 显示行号和座位号
                ctx.fillStyle = '#000';
                ctx.font = '7px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // 显示 "行-座位" 格式，例如 "1-5"
                const seatText = `${seat.row}-${seat.number}`;
                ctx.fillText(seatText, seat.x, seat.y);

                // 保留行号标识（只在每排第一个座位显示排号）
                if (seat.number === 1) {
                    ctx.fillStyle = '#666';
                    ctx.font = '12px Arial';
                    ctx.textAlign = 'right';
                    // 描边 + 填充，使文字更清晰
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.lineWidth = 1;
                    ctx.strokeText(`第${seat.row}排`, seat.x - 20, seat.y);
                    ctx.fillText(`第${seat.row}排`, seat.x - 20, seat.y);
                }
            });
        });

        // 绘制中间过道线 - 调整长度以适应动态高度
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(logicalWidth / 2, 60);
        ctx.lineTo(logicalWidth / 2, logicalHeight - 30); // 调整底部位置
        ctx.stroke();

        ctx.setLineDash([]);
    }

    function reserveTicket() {
        if (!validateBooking()) return;
        const validationErrors = validateSeatRules(state.selectedSeats);
        //console.log("Validation errors:", validationErrors); // 调试2
        if (validationErrors.length > 0) {
            const confirmMessage = [
                "这些座位可能不方便：",
                ...validationErrors,
                "是否继续操作？"
            ].join("\n");

            if (!confirm(confirmMessage)) return;
        }
    
        const bookingData = createBookingData();
        bookingData.status = 'reserved';
        bookingData.reservedAt = new Date().toISOString();

        state.allBookings.set(bookingData.id, bookingData);

        if (bookingData.ticketType === 'individual') {
            state.individualBookings.set(bookingData.customer.name, bookingData.id);
        }

        state.currentBookingId = bookingData.id;
        state.isNewBookingMode = false;
        state.selectedSeats = [];

        updateOperationButtons();
        updateTicketStatus();
        drawSeatMap();
        elements.ticketInfo.style.display = 'none';

        showError('预订成功！请在15分钟内完成付款。', 'success');
    }

    function purchaseTicket() {
        if (!validateBooking()) return;
        const validationErrors = validateSeatRules(state.selectedSeats);
        if (validationErrors.length > 0) {
            const confirmMessage = [
                "这些座位可能不方便：",
                ...validationErrors,
                "是否继续操作？"
            ].join("\n");

            if (!confirm(confirmMessage)) return;
        }
        const bookingData = createBookingData();
        bookingData.status = 'paid';
        bookingData.paidAt = new Date().toISOString();

        state.allBookings.set(bookingData.id, bookingData);

        if (bookingData.ticketType === 'individual') {
            state.individualBookings.set(bookingData.customer.name, bookingData.id);
        }

        state.currentBookingId = bookingData.id;
        state.isNewBookingMode = false;
        state.selectedSeats = [];

        updateOperationButtons();
        updateTicketStatus();
        drawSeatMap();
        elements.ticketInfo.style.display = 'none';

        showError('购票成功！', 'success');
    }

    function payTicket() {
        if (!state.currentBookingId) {
            showError('没有当前订单');
            return;
        }

        const currentBooking = state.allBookings.get(state.currentBookingId);
        if (!currentBooking || currentBooking.status !== 'reserved') {
            showError('没有需要付款的预订');
            return;
        }

        currentBooking.status = 'paid';
        currentBooking.paidAt = new Date().toISOString();

        updateOperationButtons();
        updateTicketStatus();
        drawSeatMap();

        showError('付款成功！', 'success');
    }

    function cancelBooking() {
        if (!state.currentBookingId) {
            showError('没有当前订单');
            return;
        }

        const currentBooking = state.allBookings.get(state.currentBookingId);
        if (!currentBooking || currentBooking.status !== 'reserved') {
            showError('没有可取消的预订');
            return;
        }

        if (confirm('确定要取消预订吗？座位将被释放。')) {
            currentBooking.status = 'cancelled';
            currentBooking.cancelledAt = new Date().toISOString();

            if (currentBooking.ticketType === 'individual') {
                state.individualBookings.delete(currentBooking.customer.name);
            }

            state.currentBookingId = null;
            state.isNewBookingMode = true;

            updateOperationButtons();
            updateTicketStatus();
            drawSeatMap();

            showError('预订已取消', 'info');
        }
    }

    function refundTicket() {
        if (!state.currentBookingId) {
            showError('没有当前订单');
            return;
        }

        const currentBooking = state.allBookings.get(state.currentBookingId);
        if (!currentBooking || currentBooking.status !== 'paid') {
            showError('没有可退票的订单');
            return;
        }

        if (confirm('确定要退票吗？退票后座位将释放。')) {
            currentBooking.status = 'refunded';
            currentBooking.refundedAt = new Date().toISOString();

            if (currentBooking.ticketType === 'individual') {
                state.individualBookings.delete(currentBooking.customer.name);
            }

            state.currentBookingId = null;
            state.isNewBookingMode = true;

            updateOperationButtons();
            updateTicketStatus();
            drawSeatMap();

            showError('退票成功！', 'success');
        }
    }

    function validateBooking() {
        clearError();

        if (elements.ticketType.value === 'individual') {
            const customerName = elements.individualName.value.trim();
            if (!customerName) {
                showError('请填写姓名');
                return false;
            }

            if (hasActiveIndividualBooking(customerName)) {
                showError(`客户 ${customerName} 已有一个活跃的个人票订单`);
                return false;
            }

            const age = parseInt(elements.individualAge.value);
            if (!age || age < 1 || age > 120) {
                showError('请输入有效的年龄(1-120)');
                return false;
            }

            if (state.selectedSeats.length !== 1) {
                showError('个人票请选择一个座位');
                return false;
            }
        } else {
            const groupSize = parseInt(elements.groupSize.value);

            if (!groupSize || groupSize < 2 || groupSize > 20) {
                showError('请输入2-20之间的团体人数');
                return false;
            }

            if (!collectGroupMembers()) {
                return false;
            }

            if (state.selectedSeats.length !== groupSize) {
                showError('团体票应选择' + groupSize + '个座位');
                return false;
            }
        }

        return true;
    }
    function validateSeatRules(seatIds) {
        //console.log("Validating seats:", seatIds); // 调试5
        //console.log("Group members:", state.groupMembers); // 调试6
        const errors = [];
        const ticketType = elements.ticketType.value;
        const isGroup = ticketType === 'group';

        // 获取成员年龄信息（兼容个人票/团体票）
        const ages = isGroup ? 
            state.groupMembers.map(m => m.age) : 
            [parseInt(elements.individualAge.value)];

        // 检查每个座位的规则
        seatIds.forEach(seatId => {
            const [rowStr, _] = seatId.split('-');
            const row = parseInt(rowStr);

            // 少年(15岁以下)不能坐前三排
            if (ages.some(age => age < 15) && row <= 3) {
                errors.push(`少年儿童坐在前三排（当前选择：第${row}排）`);
            }

            // 老年人(60岁以上)不能坐最后三排
            if (ages.some(age => age > 60) && row > config.rows - 3) {
                errors.push(`老年人坐在最后三排（当前选择：第${row}排）`);
            }
        });
        // 团体必须同排（仅当团体票且选择超过1个座位时检查）
        if (isGroup && seatIds.length > 1) {
            const firstRow = seatIds[0].split('-')[0];
            if (!seatIds.every(id => id.startsWith(firstRow + '-'))) {
                errors.push("团体成员未坐在同一排");
            }
    }

    return errors;
    }
    function createBookingData() {
        const ticketType = elements.ticketType.value;
        const totalPrice = state.selectedSeats.length * config.ticketPrice;

        return {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
            ticketType: ticketType,
            seats: [...state.selectedSeats],
            totalPrice: totalPrice,
            customer: ticketType === 'individual' ? {
                name: elements.individualName.value,
                age: elements.individualAge.value
            } : {
                size: elements.groupSize.value,
                members: [...state.groupMembers]
            },
            createdAt: new Date().toISOString()
        };
    }

    function updateOperationButtons() {
        const hasSelection = state.selectedSeats.length > 0;
        const isNewMode = state.isNewBookingMode;
        const currentBooking = state.currentBookingId ? state.allBookings.get(state.currentBookingId) : null;

        const hasReservation = currentBooking && currentBooking.status === 'reserved';
        const hasPaidTicket = currentBooking && currentBooking.status === 'paid';

        elements.reserveBtn.style.display = (isNewMode && hasSelection) ? 'inline-block' : 'none';
        elements.purchaseBtn.style.display = (isNewMode && hasSelection) ? 'inline-block' : 'none';

        elements.payBtn.style.display = (!isNewMode && hasReservation) ? 'inline-block' : 'none';
        elements.cancelBtn.style.display = (!isNewMode && hasReservation) ? 'inline-block' : 'none';
        elements.refundBtn.style.display = (!isNewMode && hasPaidTicket) ? 'inline-block' : 'none';
    }

    function updateTicketStatus() {
        if (state.isNewBookingMode || !state.currentBookingId) {
            elements.ticketStatus.style.display = 'none';
            return;
        }

        const currentBooking = state.allBookings.get(state.currentBookingId);
        if (!currentBooking) {
            elements.ticketStatus.style.display = 'none';
            return;
        }

        elements.ticketStatus.style.display = 'block';
        elements.ticketStatus.className = `ticket-status status-${currentBooking.status}`;

        const statusText = {
            'reserved': '已预订',
            'paid': '已付款',
            'cancelled': '已取消',
            'refunded': '已退票'
        };

        const formattedSeats = currentBooking.seats.map(seatId => {
            const [row, seat] = seatId.split('-');
            return `第${row}排${seat}号`;
        }).join(', ');

        let html = `<p><strong>状态:</strong> ${statusText[currentBooking.status]}</p>
                    <p><strong>订单号:</strong> ${currentBooking.id}</p>
                    <p><strong>座位:</strong> ${formattedSeats}</p>
                    <p><strong>总价:</strong> ¥${currentBooking.totalPrice}</p>`;

        if (currentBooking.ticketType === 'individual') {
            html += `<p><strong>客户:</strong> ${currentBooking.customer.name} (${currentBooking.customer.age}岁)</p>`;
        } else {
            html += `<p><strong>团体人数:</strong> ${currentBooking.customer.size}人</p>`;
        }

        if (currentBooking.status === 'reserved') {
            html += `<p><strong>预订时间:</strong> ${new Date(currentBooking.reservedAt).toLocaleString()}</p>
                     <p class="payment-reminder"><strong>提醒:</strong> 请在15分钟内完成付款</p>`;
        } else if (currentBooking.status === 'paid') {
            html += `<p><strong>付款时间:</strong> ${new Date(currentBooking.paidAt).toLocaleString()}</p>`;
        }

        html += `<div style="margin-top: 15px; display: flex; gap: 10px;">
                    <button onclick="switchToNewBookingMode()" style="background-color: #4CAF50; color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; flex: 1;">
                        处理新订单
                    </button>
                    <button onclick="showOrderHistory()" style="background-color: #607D8B; color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; flex: 1;">
                        查看历史
                    </button>
                </div>`;

        elements.statusDetails.innerHTML = html;
    }

    window.switchToNewBookingMode = function () {
        state.isNewBookingMode = true;
        state.currentBookingId = null;
        state.selectedSeats = [];

        elements.individualName.value = '';
        elements.individualAge.value = '';
        elements.groupSize.value = '';
        elements.groupMembers.innerHTML = '';
        state.groupMembers = [];

        hideOrderHistory();

        updateOperationButtons();
        updateTicketStatus();
        drawSeatMap();
        elements.ticketInfo.style.display = 'none';
        clearError();

        showError('已切换到新订单模式', 'success');
    };

    function resetSelection() {
        state.selectedSeats = [];
        drawSeatMap();
        clearError();
        elements.ticketInfo.style.display = 'none';
        updateOperationButtons();
    }

    function updateTicketInfo() {
        if (state.selectedSeats.length > 0) {
            elements.ticketInfo.style.display = 'block';

            const ticketType = elements.ticketType.value;
            let html = '';

            if (ticketType === 'individual') {
                const name = elements.individualName.value || '未填写';
                const age = elements.individualAge.value || '未填写';
                html = `<p><strong>票类型:</strong> 个人票</p>
                        <p><strong>姓名:</strong> ${name}</p>
                        <p><strong>年龄:</strong> ${age}</p>`;
            } else {
                const groupSize = elements.groupSize.value || '未设置';
                html = `<p><strong>票类型:</strong> 团体票</p>
                        <p><strong>人数:</strong> ${groupSize}</p>`;

                if (state.groupMembers.length > 0) {
                    html += `<p><strong>成员:</strong></p><ul>`;
                    state.groupMembers.forEach(member => {
                        html += `<li>${member.name} (${member.age}岁)</li>`;
                    });
                    html += '</ul>';
                } else {
                    html += `<p><strong>成员:</strong> 请先添加成员信息</p>`;
                }
            }

            const formattedSeats = state.selectedSeats.map(seatId => {
                const [row, seat] = seatId.split('-');
                return `第${row}排${seat}号`;
            }).join(', ');

            const totalPrice = state.selectedSeats.length * config.ticketPrice;

            html += `<p><strong>座位:</strong> ${formattedSeats}</p>
                     <p class="price-info"><strong>总价:</strong> ¥${totalPrice}</p>`;
            elements.ticketDetails.innerHTML = html;
        } else {
            elements.ticketInfo.style.display = 'none';
        }
    }

    function showError(message, type = 'error') {
        elements.errorMsg.textContent = message;
        elements.errorMsg.className = type === 'error' ? 'error' : 'success';
        elements.errorMsg.style.color = type === 'error' ? 'red' :
            type === 'success' ? 'green' : 'blue';

        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                elements.errorMsg.textContent = '';
            }, 3000);
        }
    }

    function clearError() {
        elements.errorMsg.textContent = '';
    }

    function addGroupMembers() {
        const groupSize = parseInt(elements.groupSize.value);

        if (!groupSize || groupSize < 2 || groupSize > 20) {
            showError('请输入2-20之间的团体人数');
            return;
        }

        elements.groupMembers.innerHTML = '';
        state.groupMembers = [];

        for (let i = 0; i < groupSize; i++) {
            const memberDiv = document.createElement('div');
            memberDiv.className = 'member-input';

            memberDiv.innerHTML = `
                        <label>成员 ${i + 1}:</label>
                        <input type="text" class="member-name" placeholder="姓名" required>
                        <input type="number" class="member-age" placeholder="年龄" min="1" max="120" required>
                    `;

            elements.groupMembers.appendChild(memberDiv);
        }

        elements.groupMembers.style.display = 'block';
    }

    function collectGroupMembers() {
        const nameInputs = document.querySelectorAll('.member-name');
        const ageInputs = document.querySelectorAll('.member-age');

        state.groupMembers = [];

        for (let i = 0; i < nameInputs.length; i++) {
            const name = nameInputs[i].value.trim();
            const age = parseInt(ageInputs[i].value);

            if (!name || !age) {
                showError('请填写所有成员的姓名和年龄');
                return false;
            }

            state.groupMembers.push({ name, age });
        }

        return true;
    }

    function autoSelectIndividual() {
        if (!state.isNewBookingMode) {
            showError('请先切换到新订单模式');
            return;
        }

        const customerName = elements.individualName.value.trim();
        if (customerName && hasActiveIndividualBooking(customerName)) {
            showError(`客户 ${customerName} 已有一个活跃的个人票订单`);
            return;
        }

        const age = parseInt(elements.individualAge.value);

        if (!age) {
            showError('请输入有效的年龄');
            return;
        }

        let availableRows = [];

        if (age < 15) {
            availableRows = Array.from({ length: config.rows - 3 }, (_, i) => i + 4);
        } else if (age > 60) {
            availableRows = Array.from({ length: config.rows - 3 }, (_, i) => i + 1);
        } else {
            availableRows = Array.from({ length: config.rows }, (_, i) => i + 1);
        }

        const occupiedSeats = getAllOccupiedSeats();

        for (const row of availableRows) {
            for (let seatNum = 1; seatNum <= config.seatsPerRow; seatNum++) {
                const seatId = `${row}-${seatNum}`;

                if (!occupiedSeats.includes(seatId) && !state.selectedSeats.includes(seatId)) {
                    state.selectedSeats = [seatId];
                    drawSeatMap();
                    updateTicketInfo();
                    updateOperationButtons();
                    return;
                }
            }
        }

        showError('没有找到合适的座位');
    }

    function autoSelectGroup() {
        if (!state.isNewBookingMode) {
            showError('请先切换到新订单模式');
            return;
        }

        const groupSize = parseInt(elements.groupSize.value);

        if (!groupSize || groupSize < 2 || groupSize > 20) {
            showError('请输入2-20之间的团体人数');
            return;
        }

        if (state.groupMembers.length !== groupSize) {
            showError('请先添加所有团体成员信息');
            return;
        }

        const hasChild = state.groupMembers.some(m => m.age < 15);
        const hasSenior = state.groupMembers.some(m => m.age > 60);

        let availableRows = [];

        if (hasChild && hasSenior) {
            availableRows = Array.from({ length: config.rows - 6 }, (_, i) => i + 4);
        } else if (hasChild) {
            availableRows = Array.from({ length: config.rows - 3 }, (_, i) => i + 4);
        } else if (hasSenior) {
            availableRows = Array.from({ length: config.rows - 3 }, (_, i) => i + 1);
        } else {
            availableRows = Array.from({ length: config.rows }, (_, i) => i + 1);
        }

        const occupiedSeats = getAllOccupiedSeats();

        for (const row of availableRows) {
            const rowSeats = state.seats[row - 1];
            let consecutiveSeats = 0;
            let startIndex = 0;

            for (let i = 0; i < rowSeats.length; i++) {
                const seat = rowSeats[i];

                if (!occupiedSeats.includes(seat.id) && !state.selectedSeats.includes(seat.id)) {
                    consecutiveSeats++;

                    if (consecutiveSeats === groupSize) {
                        state.selectedSeats = [];
                        for (let j = 0; j < groupSize; j++) {
                            state.selectedSeats.push(rowSeats[startIndex + j].id);
                        }
                        drawSeatMap();
                        updateTicketInfo();
                        updateOperationButtons();
                        return;
                    }
                } else {
                    consecutiveSeats = 0;
                    startIndex = i + 1;
                }
            }
        }

        showError('没有找到足够的连续座位');
    }

    function showOrderHistory() {
        elements.orderHistory.style.display = 'block';
        updateHistoryList();
    }

    function hideOrderHistory() {
        elements.orderHistory.style.display = 'none';
    }

    function updateHistoryList() {
        const statusFilter = elements.statusFilter.value;
        const typeFilter = elements.typeFilter.value;

        let filteredBookings = Array.from(state.allBookings.values());

        if (statusFilter !== 'all') {
            filteredBookings = filteredBookings.filter(booking => booking.status === statusFilter);
        }

        if (typeFilter !== 'all') {
            filteredBookings = filteredBookings.filter(booking => booking.ticketType === typeFilter);
        }

        filteredBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (filteredBookings.length === 0) {
            elements.historyList.innerHTML = '<div class="empty-history">没有找到符合条件的订单</div>';
            return;
        }

        let html = '';
        filteredBookings.forEach(booking => {
            const formattedSeats = booking.seats.map(seatId => {
                const [row, seat] = seatId.split('-');
                return `${row}-${seat}`;
            }).join(', ');

            const statusText = {
                'reserved': '已预订',
                'paid': '已付款',
                'cancelled': '已取消',
                'refunded': '已退票'
            };

            const customerInfo = booking.ticketType === 'individual'
                ? `${booking.customer.name} (${booking.customer.age}岁)`
                : `团体 ${booking.customer.size}人`;

            const canManage = (booking.status === 'reserved' || booking.status === 'paid') &&
                booking.id !== state.currentBookingId;

            html += `
                <div class="history-item ${booking.id === state.currentBookingId ? 'active' : ''}" 
                     data-booking-id="${booking.id}">
                    <div class="history-item-header">
                        <span class="history-item-id">订单 ${booking.id.slice(-8)}</span>
                        <span class="history-item-status status-${booking.status}">
                            ${statusText[booking.status]}
                        </span>
                    </div>
                    <div class="history-item-details">
                        <div class="history-item-customer">${customerInfo}</div>
                        <div class="history-item-seats">座位: ${formattedSeats}</div>
                        <div class="history-item-price">总价: ¥${booking.totalPrice}</div>
                        <div style="font-size: 11px; color: #999; margin-top: 3px;">
                            创建时间: ${new Date(booking.createdAt).toLocaleString()}
                        </div>
                    </div>
                    <div class="history-item-actions">
                        <button class="history-action-btn view-btn" onclick="viewBookingDetails('${booking.id}')">
                            查看详情
                        </button>
                        ${canManage ? `
                            <button class="history-action-btn manage-btn" onclick="manageBooking('${booking.id}')">
                                管理订单
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        });

        elements.historyList.innerHTML = html;
    }

    window.viewBookingDetails = function (bookingId) {
        const booking = state.allBookings.get(bookingId);
        if (!booking) return;

        const formattedSeats = booking.seats.map(seatId => {
            const [row, seat] = seatId.split('-');
            return `第${row}排${seat}号`;
        }).join(', ');

        const statusText = {
            'reserved': '已预订',
            'paid': '已付款',
            'cancelled': '已取消',
            'refunded': '已退票'
        };

        let details = `订单详情：
订单号: ${booking.id}
状态: ${statusText[booking.status]}
票类型: ${booking.ticketType === 'individual' ? '个人票' : '团体票'}
座位: ${formattedSeats}
总价: ¥${booking.totalPrice}
创建时间: ${new Date(booking.createdAt).toLocaleString()}`;

        if (booking.ticketType === 'individual') {
            details += `
客户: ${booking.customer.name} (${booking.customer.age}岁)`;
        } else {
            details += `
团体人数: ${booking.customer.size}人
成员信息:`;
            booking.customer.members.forEach((member, index) => {
                details += `
  ${index + 1}. ${member.name} (${member.age}岁)`;
            });
        }

        if (booking.reservedAt) {
            details += `
预订时间: ${new Date(booking.reservedAt).toLocaleString()}`;
        }

        if (booking.paidAt) {
            details += `
付款时间: ${new Date(booking.paidAt).toLocaleString()}`;
        }

        if (booking.cancelledAt) {
            details += `
取消时间: ${new Date(booking.cancelledAt).toLocaleString()}`;
        }

        if (booking.refundedAt) {
            details += `
退票时间: ${new Date(booking.refundedAt).toLocaleString()}`;
        }

        alert(details);
    };

    window.manageBooking = function (bookingId) {
        const booking = state.allBookings.get(bookingId);
        if (!booking) return;

        if (booking.status !== 'reserved' && booking.status !== 'paid') {
            showError('只能管理已预订或已付款的订单');
            return;
        }

        state.currentBookingId = bookingId;
        state.isNewBookingMode = false;
        state.selectedSeats = [];

        elements.individualName.value = '';
        elements.individualAge.value = '';
        elements.groupSize.value = '';
        elements.groupMembers.innerHTML = '';
        state.groupMembers = [];

        hideOrderHistory();

        updateOperationButtons();
        updateTicketStatus();
        drawSeatMap();
        elements.ticketInfo.style.display = 'none';
        clearError();

        showError(`已切换到订单 ${bookingId.slice(-8)} 的管理模式`, 'success');
    };

    window.showOrderHistory = showOrderHistory;

    // 修改事件监听器设置
    function setupEventListeners() {
        // 添加影院配置事件
        elements.applyCinemaBtn.addEventListener('click', applyCinemaConfig);
        
        elements.cinemaCapacity.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                applyCinemaConfig();
            }
        });

        elements.ticketType.addEventListener('change', function () {
            if (this.value === 'individual') {
                elements.individualForm.style.display = 'block';
                elements.groupForm.style.display = 'none';
            } else {
                elements.individualForm.style.display = 'none';
                elements.groupForm.style.display = 'block';
            }

            resetSelection();
        });

        elements.individualName.addEventListener('input', function () {
            if (state.isNewBookingMode) {
                updateTicketInfo();
            }
        });

        elements.individualAge.addEventListener('input', function () {
            if (state.isNewBookingMode) {
                updateTicketInfo();
            }
        });

        elements.groupSize.addEventListener('input', function () {
            if (state.isNewBookingMode) {
                updateTicketInfo();
            }
        });

        elements.addMembersBtn.addEventListener('click', addGroupMembers);

        elements.autoSelectBtn.addEventListener('click', function () {
            if (!state.isNewBookingMode) {
                showError('请先切换到新订单模式');
                return;
            }

            clearError();
            state.selectedSeats = [];

            const ticketType = elements.ticketType.value;

            if (ticketType === 'individual') {
                autoSelectIndividual();
            } else {
                if (collectGroupMembers()) {
                    autoSelectGroup();
                }
            }
        });

        elements.manualSelectBtn.addEventListener('click', function () {
            if (!state.isNewBookingMode) {
                showError('请先切换到新订单模式');
                return;
            }

            clearError();

            const ticketType = elements.ticketType.value;
            const requiredSeats = ticketType === 'individual' ? 1 : parseInt(elements.groupSize.value);

            if (ticketType === 'individual') {
                const customerName = elements.individualName.value.trim();
                if (customerName && hasActiveIndividualBooking(customerName)) {
                    showError(`客户 ${customerName} 已有一个活跃的个人票订单`);
                    return;
                }
            }

            if (ticketType === 'group' && (!requiredSeats || requiredSeats < 2 || requiredSeats > 20)) {
                showError('请输入2-20之间的团体人数');
                return;
            }

            if (ticketType === 'group' && !collectGroupMembers()) {
                return;
            }

            if (state.selectedSeats.length !== requiredSeats) {
                showError(`请选择${requiredSeats}个座位`);
                return;
            }

            updateTicketInfo();
            showError('手动选座完成，请确认座位信息', 'success');
        });

        elements.resetBtn.addEventListener('click', resetSelection);

        elements.reserveBtn.addEventListener('click', reserveTicket);
        elements.purchaseBtn.addEventListener('click', purchaseTicket);
        elements.payBtn.addEventListener('click', payTicket);
        elements.cancelBtn.addEventListener('click', cancelBooking);
        elements.refundBtn.addEventListener('click', refundTicket);

        //团体票提示按ctrl
        const ticketTypeSelect = document.getElementById('ticketType');
        const multiSelectHint = document.getElementById('multiSelectHint');
        // 当下拉框值变化时
        ticketTypeSelect.addEventListener('change', () => {
            if (ticketTypeSelect.value === 'group') {
                multiSelectHint.style.display = 'block'; // 显示提示
            } else {
                multiSelectHint.style.display = 'none';  // 隐藏提示
            }
        });

        canvas.addEventListener('click', handleSeatClick);

        elements.toggleHistoryBtn.addEventListener('click', function () {
            if (elements.orderHistory.style.display === 'none') {
                showOrderHistory();
            } else {
                hideOrderHistory();
            }
        });

        elements.closeHistoryBtn.addEventListener('click', hideOrderHistory);

        elements.statusFilter.addEventListener('change', updateHistoryList);
        elements.typeFilter.addEventListener('change', updateHistoryList);
    }

    // 修改初始化函数
    function initApp() {
        const canvas = document.getElementById('cinemaCanvas');
        const ctx = canvas.getContext('2d');

        //  设置高质量渲染模式（优化抗锯齿）
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        updateCapacityDisplay();
        resizeCanvas();
        initializeSeats();
        drawSeatMap();
        setupEventListeners();
        updateOperationButtons();
        updateTicketStatus();
    }

    initApp();
});