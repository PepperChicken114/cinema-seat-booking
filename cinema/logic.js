 document.addEventListener('DOMContentLoaded', function() {
            const canvas = document.getElementById('cinemaCanvas');
            const ctx = canvas.getContext('2d');
            
            // 影院配置 - 10排，每排20个座位
            const config = {
                rows: 10,
                seatsPerRow: 20,
                reservedSeats: ['1-1', '1-2', '1-10', '1-20', 
                               '2-5', '2-15', 
                               '3-7', '3-8', '3-9',
                               '4-1', '4-20',
                               '5-10', '5-11',
                               '6-5', '6-6', '6-15', '6-16',
                               '7-1', '7-20',
                               '8-10',
                               '9-5', '9-15',
                               '10-1', '10-2', '10-19', '10-20']
            };
            
            // 状态管理
            const state = {
                selectedSeats: [],
                reservedSeats: [...config.reservedSeats],
                groupMembers: [],
                seats: [] // 存储所有座位信息
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
                confirmBtn: document.getElementById('confirmBtn')
            };
            
            // 初始化座位数据
            function initializeSeats() {
                state.seats = [];
                const centerX = canvas.width / 2;
                const startY = 100;
                const rowSpacing = 30;
                const maxCurve = 300; // 最大弧形偏移量
                
                for (let row = 1; row <= config.rows; row++) {
                    const rowSeats = [];
                    const rowY = startY + (row - 1) * rowSpacing;
                    
                    // 计算当前行的弧形偏移量 (越靠后的排数弧形越小)
                    const curveFactor = 1 - (row / config.rows) * 0.7;
                    const curve = maxCurve * curveFactor;
                    
                    for (let seatNum = 1; seatNum <= config.seatsPerRow; seatNum++) {
                        // 计算座位在弧形上的位置
                        const angle = Math.PI * (seatNum / (config.seatsPerRow + 1) - 0.5);
                        const x = centerX + Math.sin(angle) * curve;
                        
                        const seatId = `${row}-${seatNum}`;
                        const isReserved = state.reservedSeats.includes(seatId);
                        
                        rowSeats.push({
                            id: seatId,
                            row: row,
                            number: seatNum,
                            x: x,
                            y: rowY,
                            isReserved: isReserved,
                            radius: 12
                        });
                    }
                    state.seats.push(rowSeats);
                }
            }
            
            // 绘制座位图 - 这是显示座位的关键函数
            function drawSeatMap() {
                // 清除画布
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // 绘制屏幕
                ctx.fillStyle = '#333';
                ctx.fillRect(150, 30, 400, 30);
                ctx.fillStyle = '#666';
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('银幕', canvas.width / 2, 80);
                
                // 绘制所有座位
                state.seats.forEach(rowSeats => {
                    rowSeats.forEach(seat => {
                        // 开始绘制座位圆形
                        ctx.beginPath();
                        ctx.arc(seat.x, seat.y, seat.radius, 0, Math.PI * 2);
                        
                        // 设置座位颜色
                        if (seat.isReserved) {
                            ctx.fillStyle = '#F44336'; // 已售 - 红色
                        } else if (state.selectedSeats.includes(seat.id)) {
                            ctx.fillStyle = '#FFEB3B'; // 已选 - 黄色
                        } else {
                            ctx.fillStyle = '#4CAF50'; // 可选 - 绿色
                        }
                        
                        ctx.fill();
                        ctx.strokeStyle = '#333';
                        ctx.stroke();
                        
                        // 绘制座位号
                        ctx.fillStyle = '#000';
                        ctx.font = '10px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(seat.number, seat.x, seat.y);
                        
                        // 绘制排号 (每排第一个座位左侧)
                        if (seat.number === 1) {
                            ctx.fillStyle = '#000';
                            ctx.font = '12px Arial';
                            ctx.textAlign = 'right';
                            ctx.fillText(`第${seat.row}排`, seat.x - 15, seat.y);
                        }
                    });
                });
            }
            
            // 处理座位点击事件
            function handleSeatClick(event) {
                const rect = canvas.getBoundingClientRect();
                const mouseX = event.clientX - rect.left;
                const mouseY = event.clientY - rect.top;
                
                let clickedSeat = null;
                
                // 检查点击了哪个座位
                state.seats.forEach(rowSeats => {
                    rowSeats.forEach(seat => {
                        const distance = Math.sqrt(
                            Math.pow(mouseX - seat.x, 2) + 
                            Math.pow(mouseY - seat.y, 2)
                        );
                        
                        if (distance <= seat.radius && !seat.isReserved) {
                            clickedSeat = seat;
                        }
                    });
                });
                
                if (clickedSeat) {
                    const index = state.selectedSeats.indexOf(clickedSeat.id);
                    
                    if (index === -1) {
                        state.selectedSeats.push(clickedSeat.id);
                    } else {
                        state.selectedSeats.splice(index, 1);
                    }
                    
                    // 重新绘制座位图
                    drawSeatMap();
                    updateTicketInfo();
                }
            }
            
            // 更新票务信息显示
            function updateTicketInfo() {
                if (state.selectedSeats.length > 0) {
                    elements.ticketInfo.style.display = 'block';
                    
                    const ticketType = elements.ticketType.value;
                    let html = '';
                    
                    if (ticketType === 'individual') {
                        const name = elements.individualName.value;
                        const age = elements.individualAge.value;
                        html = `<p><strong>票类型:</strong> 个人票</p>
                                <p><strong>姓名:</strong> ${name}</p>
                                <p><strong>年龄:</strong> ${age}</p>`;
                    } else {
                        html = `<p><strong>票类型:</strong> 团体票</p>
                                <p><strong>人数:</strong> ${elements.groupSize.value}</p>
                                <p><strong>成员:</strong></p><ul>`;
                        
                        state.groupMembers.forEach(member => {
                            html += `<li>${member.name} (${member.age}岁)</li>`;
                        });
                        
                        html += '</ul>';
                    }
                    
                    html += `<p><strong>座位:</strong> ${state.selectedSeats.join(', ')}</p>`;
                    elements.ticketDetails.innerHTML = html;
                } else {
                    elements.ticketInfo.style.display = 'none';
                }
            }
            
            // 自动选座 - 个人票
            function autoSelectIndividual() {
                const age = parseInt(elements.individualAge.value);
             
                if (!age) {
                    showError('请输入有效的年龄');
                    return;
                }
                
                // 根据年龄确定可选排数
                let availableRows = [];
                
                if (age < 15) { // 少年
                    availableRows = Array.from({length: config.rows - 3}, (_, i) => i + 4); // 不能坐前三排
                } else if (age > 60) { // 老年人
                    availableRows = Array.from({length: config.rows - 3}, (_, i) => i + 1); // 不能坐最后三排
                } else { // 成年人
                    availableRows = Array.from({length: config.rows}, (_, i) => i + 1);
                }
                
                // 寻找可用座位
                for (const row of availableRows) {
                    for (let seatNum = 1; seatNum <= config.seatsPerRow; seatNum++) {
                        const seatId = `${row}-${seatNum}`;
                        
                        if (!state.reservedSeats.includes(seatId) && !state.selectedSeats.includes(seatId)) {
                            state.selectedSeats.push(seatId);
                            drawSeatMap();
                            updateTicketInfo();
                            return;
                        }
                    }
                }
                
                showError('没有找到合适的座位');
            }
            
            // 自动选座 - 团体票
            function autoSelectGroup() {
                const groupSize = parseInt(elements.groupSize.value);
                
                // if (!groupSize || groupSize < 2 || groupSize > 20) {
                //     showError('请输入2-20之间的团体人数');
                //     return;
                // }
                
                // if (state.groupMembers.length !== groupSize) {
                //     showError('请先添加所有团体成员信息');
                //     return;
                // }
                
                // 检查团体成员年龄限制
                const hasChild = state.groupMembers.some(m => m.age < 15);
                const hasSenior = state.groupMembers.some(m => m.age > 60);
                
                let availableRows = [];
                
                if (hasChild && hasSenior) {
                    // 既有少年又有老年人 - 只能坐中间排
                    availableRows = Array.from({length: config.rows - 6}, (_, i) => i + 4);
                } else if (hasChild) {
                    // 只有少年 - 不能坐前三排
                    availableRows = Array.from({length: config.rows - 3}, (_, i) => i + 4);
                } else if (hasSenior) {
                    // 只有老年人 - 不能坐最后三排
                    availableRows = Array.from({length: config.rows - 3}, (_, i) => i + 1);
                } else {
                    // 都是成年人 - 可以坐任何排
                    availableRows = Array.from({length: config.rows}, (_, i) => i + 1);
                }
                
                // 寻找连续座位
                for (const row of availableRows) {
                    const rowSeats = state.seats[row-1];
                    let consecutiveSeats = 0;
                    let startIndex = 0;
                    
                    for (let i = 0; i < rowSeats.length; i++) {
                        const seat = rowSeats[i];
                        
                        if (!seat.isReserved && !state.selectedSeats.includes(seat.id)) {
                            consecutiveSeats++;
                            
                            if (consecutiveSeats === groupSize) {
                                // 找到足够的连续座位
                                for (let j = 0; j < groupSize; j++) {
                                    state.selectedSeats.push(rowSeats[startIndex + j].id);
                                }
                                drawSeatMap();
                                updateTicketInfo();
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
            
            // 重置选择
            function resetSelection() {
                state.selectedSeats = [];
                drawSeatMap();
                clearError();
                elements.ticketInfo.style.display = 'none';
              //  isManualSelectionMode = false;
            }
            
            // 显示错误信息
            function showError(message) {
                elements.errorMsg.textContent = message;
            }
            
            // 清除错误信息
            function clearError() {
                elements.errorMsg.textContent = '';
            }
            
            // 添加团体成员信息
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
            
            // 收集团体成员信息
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
            
            // 确认购票
function confirmBooking() {
    clearError();
    
    // 验证表单
    if (elements.ticketType.value === 'individual') {
        // 个人票验证
        if (!elements.individualName.value) {
            showError('请填写姓名');
            return;
        }
        
        const age = parseInt(elements.individualAge.value);
        if (!age || age < 1 || age > 120) {
            showError('请输入有效的年龄(1-120)');
            return;
        }
        
        if (state.selectedSeats.length === 0) {
            showError('请先选择座位');
            return;
        }
        
        if (state.selectedSeats.length > 1) {
            showError('个人票只能选择一个座位');
            return;
        }
    } 
    else if (elements.ticketType.value === 'group') {
        // 团体票验证
        const groupSize = parseInt(elements.groupSize.value);
        
        // 验证团体人数
        if (!groupSize || groupSize < 2 || groupSize > 20) {
            showError('请输入2-20之间的团体人数');
            return;
        }
        
        // 验证成员信息
        if (!collectGroupMembers()) {
            showError('请填写所有成员的完整信息');
            return;
        }
        
        // 验证成员数量匹配
        if (state.groupMembers.length !== groupSize) {
            showError('成员数量不匹配，请检查');
            return;
        }
        
        // 验证座位选择
        if (state.selectedSeats.length === 0) {
            showError('请先选择座位');
            return;
        }
        
        if (state.selectedSeats.length !== groupSize) {
            showError('团体票应选择' + groupSize + '个座位');
            return;
        }
    }
    
    // 购票成功处理
    alert('购票成功!');
    console.log('购票信息:', {
        ticketType: elements.ticketType.value,
        individual: elements.ticketType.value === 'individual' ? {
            name: elements.individualName.value,
            age: elements.individualAge.value
        } : null,
        group: elements.ticketType.value === 'group' ? {
            size: elements.groupSize.value,
            members: state.groupMembers
        } : null,
        seats: state.selectedSeats
    });
    
    // 标记座位为已预订
    state.reservedSeats.push(...state.selectedSeats);
    state.selectedSeats = [];
    
    // 重新初始化座位数据并绘制
    initializeSeats();
    drawSeatMap();
    elements.ticketInfo.style.display = 'none';
}
          //  let isManualSelectionMode = false;
            // 设置事件监听器
            function setupEventListeners() {
                elements.ticketType.addEventListener('change', function() {
                    if (this.value === 'individual') {
                        elements.individualForm.style.display = 'block';
                        elements.groupForm.style.display = 'none';
                    } else {
                        elements.individualForm.style.display = 'none';
                        elements.groupForm.style.display = 'block';
                    }
                    
                    resetSelection();
                });
                
                elements.addMembersBtn.addEventListener('click', addGroupMembers);
                elements.autoSelectBtn.addEventListener('click', function() {
                    clearError();
                    state.selectedSeats = [];
                    
                    const ticketType = elements.ticketType.value;
                    
                    if (ticketType === 'individual') {
                        autoSelectIndividual();
                    } else {
                        collectGroupMembers()


                        autoSelectGroup();
                    }
                });
                
                

                // 手动选座按钮事件监听器
                elements.manualSelectBtn.addEventListener('click', function() {
                    clearError();
                    
                    const ticketType = elements.ticketType.value;
                    const requiredSeats = ticketType === 'individual' ? 1 : parseInt(elements.groupSize.value);
                    
                    if (ticketType === 'group' && (!requiredSeats || requiredSeats < 2 || requiredSeats > 20)) {
                        showError('请输入2-20之间的团体人数');
                        return;
                    }
                    
                    if (ticketType === 'group' && state.groupMembers.length !== requiredSeats) {
                        showError('请先添加所有团体成员信息');
                        return;
                    }
                    
                    // 检查已选座位数量
                    if (state.selectedSeats.length !== requiredSeats) {
                        showError(`请选择${requiredSeats}个座位`);
                        return;
                    }
                    
                    updateTicketInfo();
                });
                
                elements.resetBtn.addEventListener('click', resetSelection);
                elements.confirmBtn.addEventListener('click', confirmBooking);
                canvas.addEventListener('click', handleSeatClick);
            }
            
            // 初始化应用
            function initApp() {
                initializeSeats();
                drawSeatMap();
                setupEventListeners();
            }
            
            // 启动应用
            initApp();
        });