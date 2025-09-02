// 标签页切换功能
function initTabSwitching() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 移除所有活动状态
            navButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));

            // 添加活动状态
            button.classList.add('active');
            const targetTab = document.getElementById(button.dataset.tab + '-tab');
            if (targetTab) {
                targetTab.classList.add('active');
            }
        });
    });
}

// 文件上传功能
function initFileUpload() {
    const editUpload = document.getElementById('edit-upload');
    const selectUpload = document.getElementById('select-upload');
    const editFileInput = document.getElementById('edit-file-input');
    const selectFileInput = document.getElementById('select-file-input');

    // AI修图上传
    if (editUpload && editFileInput) {
        editFileInput.addEventListener('change', (e) => {
            handleFileUpload(e.target.files, 'edit');
        });

        // 拖拽上传
        editUpload.addEventListener('dragover', (e) => {
            e.preventDefault();
            editUpload.style.borderColor = '#764ba2';
            editUpload.style.background = 'rgba(102, 126, 234, 0.1)';
        });

        editUpload.addEventListener('dragleave', (e) => {
            e.preventDefault();
            editUpload.style.borderColor = '#667eea';
            editUpload.style.background = 'transparent';
        });

        editUpload.addEventListener('drop', (e) => {
            e.preventDefault();
            editUpload.style.borderColor = '#667eea';
            editUpload.style.background = 'transparent';
            handleFileUpload(e.dataTransfer.files, 'edit');
        });
    }

    // AI选图上传
    if (selectUpload && selectFileInput) {
        selectFileInput.addEventListener('change', (e) => {
            handleFileUpload(e.target.files, 'select');
        });

        // 拖拽上传
        selectUpload.addEventListener('dragover', (e) => {
            e.preventDefault();
            selectUpload.style.borderColor = '#764ba2';
            selectUpload.style.background = 'rgba(102, 126, 234, 0.1)';
        });

        selectUpload.addEventListener('dragleave', (e) => {
            e.preventDefault();
            selectUpload.style.borderColor = '#667eea';
            selectUpload.style.background = 'transparent';
        });

        selectUpload.addEventListener('drop', (e) => {
            e.preventDefault();
            selectUpload.style.borderColor = '#667eea';
            selectUpload.style.background = 'transparent';
            handleFileUpload(e.dataTransfer.files, 'select');
        });
    }
}

// 处理文件上传
function handleFileUpload(files, type) {
    if (files.length === 0) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const validFiles = Array.from(files).filter(file => validTypes.includes(file.type));

    if (validFiles.length === 0) {
        showNotification('请上传有效的图片文件（JPG、PNG、WEBP、GIF）', 'error');
        return;
    }

    if (type === 'edit') {
        handleEditUpload(validFiles[0]); // 修图只处理第一个文件
    } else if (type === 'select') {
        handleSelectUpload(validFiles); // 选图处理所有文件
    }
}

// 处理AI修图上传
function handleEditUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const originalPreview = document.getElementById('original-preview');
        if (originalPreview) {
            originalPreview.innerHTML = `
                <img src="${e.target.result}" alt="原图" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;">
            `;
        }
        
        // 模拟AI处理
        setTimeout(() => {
            const editedPreview = document.getElementById('edited-preview');
            if (editedPreview) {
                editedPreview.innerHTML = `
                    <img src="${e.target.result}" alt="修图后" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px; filter: brightness(1.1) contrast(1.1) saturate(1.2);">
                    <div style="position: absolute; top: 10px; right: 10px; background: rgba(102, 126, 234, 0.9); color: white; padding: 5px 10px; border-radius: 15px; font-size: 0.8rem;">AI增强完成</div>
                `;
                editedPreview.style.position = 'relative';
            }
        }, 1500);
    };
    reader.readAsDataURL(file);
    
    showNotification(`已上传图片：${file.name}`, 'success');
}

// 处理AI选图上传
function handleSelectUpload(files) {
    const photoGrid = document.getElementById('photo-grid');
    if (!photoGrid) return;

    // 清空现有内容
    photoGrid.innerHTML = '';
    
    showNotification(`已上传 ${files.length} 张图片，正在进行AI分析...`, 'info');

    // 调用真实的AI分析
    analyzeImages(files)
        .then(results => {
            // 显示分析结果
            results.forEach((result, index) => {
                const photoItem = document.createElement('div');
                photoItem.className = `photo-item ${result.quality}`;
                photoItem.innerHTML = `
                    <div class="photo-placeholder" style="background-image: url('/api/image/${result.filename}'); background-size: cover; background-position: center;">
                        <div style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 5px 10px; border-radius: 15px; font-size: 0.8rem;">
                            ${result.quality === 'recommended' ? '★ 推荐' : result.quality === 'good' ? '👍 良好' : '📷 一般'}
                        </div>
                    </div>
                    <div class="photo-score">评分: ${result.score}/10</div>
                    <div class="photo-tags">
                        ${result.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                `;
                
                photoItem.querySelector('.photo-placeholder').style.position = 'relative';
                photoGrid.appendChild(photoItem);
            });
            
            showNotification('AI分析完成！已为您推荐最佳照片', 'success');
        })
        .catch(error => {
            console.error('AI分析失败:', error);
            showNotification(`AI分析失败: ${error.message}`, 'error');
            
            // 降级到本地预览
            files.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const photoItem = document.createElement('div');
                    photoItem.className = 'photo-item average';
                    photoItem.innerHTML = `
                        <div class="photo-placeholder" style="background-image: url('${e.target.result}'); background-size: cover; background-position: center;">
                            <div style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 5px 10px; border-radius: 15px; font-size: 0.8rem;">
                                📷 本地预览
                            </div>
                        </div>
                        <div class="photo-score">评分: --/10</div>
                        <div class="photo-tags">
                            <span class="tag">等待分析</span>
                        </div>
                    `;
                    
                    photoItem.querySelector('.photo-placeholder').style.position = 'relative';
                    photoGrid.appendChild(photoItem);
                };
                reader.readAsDataURL(file);
            });
        });
}

// 工具按钮功能
function initToolButtons() {
    const toolButtons = document.querySelectorAll('.tool-btn');
    
    toolButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const toolName = button.textContent.trim();
            
            // 添加点击效果
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = 'translateY(-2px)';
            }, 150);
            
            // 获取当前上传的文件
            const editFileInput = document.getElementById('edit-file-input');
            if (!editFileInput || !editFileInput.files[0]) {
                showNotification('请先上传图片', 'warning');
                return;
            }
            
            const file = editFileInput.files[0];
            const toolType = getToolType(toolName);
            
            showNotification(`正在应用 ${toolName}...`, 'info');
            
            try {
                const processedImageUrl = await processImage(file, toolType);
                
                // 更新预览图
                const editedPreview = document.getElementById('edited-preview');
                if (editedPreview) {
                    editedPreview.innerHTML = `
                        <img src="${processedImageUrl}" alt="修图后" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;">
                        <div style="position: absolute; top: 10px; right: 10px; background: rgba(102, 126, 234, 0.9); color: white; padding: 5px 10px; border-radius: 15px; font-size: 0.8rem;">${toolName}完成</div>
                    `;
                    editedPreview.style.position = 'relative';
                }
                
                showNotification(`${toolName} 应用完成！`, 'success');
            } catch (error) {
                showNotification(`${toolName} 处理失败: ${error.message}`, 'error');
            }
        });
    });
}

// 真实的AI修图处理
function processImage(file, tool) {
    return new Promise(async (resolve, reject) => {
        try {
            // 首先上传文件
            const formData = new FormData();
            formData.append('file', file);
            
            const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            if (!uploadResponse.ok) {
                throw new Error('文件上传失败');
            }
            
            const uploadResult = await uploadResponse.json();
            const filename = uploadResult.filename;
            
            // 调用AI增强API
            const enhanceResponse = await fetch('/api/enhance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filename: filename,
                    type: tool,
                    intensity: getIntensityForTool(tool)
                })
            });
            
            if (!enhanceResponse.ok) {
                throw new Error('图像处理失败');
            }
            
            const enhanceResult = await enhanceResponse.json();
            const processedFilename = enhanceResult.processed_filename;
            
            // 返回处理后的图片URL
            resolve(`/api/image/${processedFilename}`);
            
        } catch (error) {
            console.error('图像处理错误:', error);
            reject(error);
        }
    });
}

// 获取工具类型
function getToolType(toolName) {
    if (toolName.includes('亮度')) return 'brightness';
    if (toolName.includes('对比度')) return 'contrast';
    if (toolName.includes('色彩')) return 'color';
    if (toolName.includes('锐化')) return 'sharpness';
    if (toolName.includes('自动增强')) return 'auto';
    return 'auto';
}

// 获取不同工具的强度参数
function getIntensityForTool(tool) {
    const intensityMap = {
        'auto': 1.0,
        'brightness': 1.2,
        'contrast': 1.3,
        'color': 1.2,
        'sharpness': 1.1
    };
    return intensityMap[tool] || 1.2;
}

// 通知系统
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${getNotificationIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    // 添加样式
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: getNotificationColor(type),
        color: 'white',
        padding: '15px 20px',
        borderRadius: '10px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        zIndex: '1000',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '14px',
        fontWeight: '500',
        maxWidth: '300px',
        animation: 'slideInRight 0.3s ease'
    });
    
    document.body.appendChild(notification);
    
    // 自动移除
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

function getNotificationColor(type) {
    switch (type) {
        case 'success': return '#28a745';
        case 'error': return '#dc3545';
        case 'warning': return '#ffc107';
        default: return '#667eea';
    }
}

// 添加动画样式
function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// 重置功能
function initResetButton() {
    const resetButtons = document.querySelectorAll('.btn-secondary');
    
    resetButtons.forEach(button => {
        if (button.textContent.includes('重置')) {
            button.addEventListener('click', () => {
                // 重置预览图片
                const originalPreview = document.getElementById('original-preview');
                const editedPreview = document.getElementById('edited-preview');
                
                if (originalPreview) {
                    originalPreview.innerHTML = `
                        <i class="fas fa-image"></i>
                        <p>原始图片预览</p>
                    `;
                }
                
                if (editedPreview) {
                    editedPreview.innerHTML = `
                        <i class="fas fa-magic"></i>
                        <p>AI修图预览</p>
                    `;
                    editedPreview.style.position = '';
                }
                
                // 清空文件输入
                const editFileInput = document.getElementById('edit-file-input');
                if (editFileInput) {
                    editFileInput.value = '';
                }
                
                // 添加重置动画效果
                button.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    button.style.transform = '';
                }, 150);
                
                showNotification('已重置所有修图内容', 'success');
            });
        }
    });
}

// 初始化所有功能
function init() {
    initTabSwitching();
    initFileUpload();
    initToolButtons();
    initResetButton();
    addAnimationStyles();
    
    // 欢迎消息
    setTimeout(() => {
        showNotification('欢迎使用AI摄影工具！', 'success');
    }, 500);
}

// 真实的AI选图分析
function analyzeImages(files) {
    return new Promise(async (resolve, reject) => {
        try {
            const uploadedFiles = [];
            
            // 上传所有文件
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);
                
                const uploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                
                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    uploadedFiles.push({
                        file,
                        filename: uploadResult.filename,
                        originalName: uploadResult.original_name
                    });
                }
            }
            
            if (uploadedFiles.length === 0) {
                throw new Error('没有文件上传成功');
            }
            
            // 调用分析API
            const filenames = uploadedFiles.map(item => item.filename);
            const analyzeResponse = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filenames: filenames,
                    criteria: ['composition', 'sharpness', 'color']
                })
            });
            
            if (!analyzeResponse.ok) {
                throw new Error('图像分析失败');
            }
            
            const analyzeResult = await analyzeResponse.json();
            
            // 合并文件对象和分析结果
            const results = analyzeResult.results.map(result => {
                const uploadedFile = uploadedFiles.find(item => item.filename === result.filename);
                return {
                    file: uploadedFile ? uploadedFile.file : null,
                    filename: result.filename,
                    score: result.score,
                    tags: result.tags,
                    quality: result.quality
                };
            }).filter(result => result.file !== null);
            
            resolve(results);
            
        } catch (error) {
            console.error('图像分析错误:', error);
            reject(error);
        }
    });
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}