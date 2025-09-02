# AI摄影工具

一个基于Web的智能摄影工具，提供AI修图和AI选图功能，帮助用户快速处理和筛选照片。

## 功能特性

### 🎨 AI修图模块
- **智能修复**：自动增强图片质量
- **亮度调节**：智能调整图片亮度
- **对比度优化**：增强图片对比度效果
- **色彩平衡**：优化图片色彩饱和度
- **风景滤镜**：专业风景照片处理
- **人像美化**：人像照片智能优化
- **背景虚化**：突出主体，虚化背景
- **风格转换**：多种艺术风格转换

### 📸 AI选图模块
- **智能评分**：基于多维度算法对照片进行质量评分
- **构图分析**：分析照片构图质量
- **清晰度检测**：检测照片清晰度和锐度
- **色彩分析**：评估照片色彩丰富度和饱和度
- **光线评估**：分析照片光线条件
- **智能推荐**：自动推荐最佳照片
- **批量处理**：支持多张照片同时分析

## 技术架构

### 前端技术
- **HTML5**：现代化页面结构
- **CSS3**：响应式设计和动画效果
- **JavaScript (ES6+)**：交互逻辑和API调用
- **拖拽上传**：支持文件拖拽和点击上传
- **实时预览**：即时显示处理结果

### 后端技术
- **Flask**：轻量级Python Web框架
- **PIL (Pillow)**：图像处理库
- **OpenCV**：计算机视觉和图像分析
- **NumPy**：数值计算支持
- **Flask-CORS**：跨域资源共享支持

## 项目结构

```
ai_photo/
├── app.py              # Flask后端主应用
├── index.html          # 前端主页面
├── styles.css          # 样式文件
├── script.js           # 前端交互逻辑
├── requirements.txt    # Python依赖包
├── uploads/           # 上传文件存储目录
├── processed/         # 处理后文件存储目录
└── README.md          # 项目说明文档
```

## 安装和使用

### 环境要求
- Python 3.7+
- 现代浏览器（Chrome、Firefox、Safari、Edge）

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd ai_photo
   ```

2. **安装Python依赖**
   ```bash
   pip install -r requirements.txt
   ```
   
   或者手动安装：
   ```bash
   pip install Flask Flask-CORS Pillow opencv-python numpy Werkzeug gunicorn
   ```

3. **启动后端服务**
   ```bash
   python3 app.py
   ```

4. **访问应用**
   -启动Flask后端服务器，使用端口 5001`python3 app.py`
   - 打开浏览器访问：`http://localhost:5001`

### 使用说明

#### AI修图功能
1. 点击"AI修图"标签页
2. 上传图片（支持拖拽或点击上传）
3. 选择修图工具（自动增强、亮度调节等）
4. 查看修图效果
5. 可以重置重新开始

#### AI选图功能
1. 点击"AI选图"标签页
2. 批量上传多张图片
3. 等待AI分析完成
4. 查看评分和推荐结果
5. 根据标签了解照片特点

## API接口

### 文件上传
```
POST /api/upload
Content-Type: multipart/form-data

参数：
- file: 图片文件

返回：
{
  "success": true,
  "filename": "unique_filename.jpg",
  "original_name": "original.jpg",
  "size": 1024000,
  "width": 1920,
  "height": 1080,
  "format": "JPEG"
}
```

### AI图像增强
```
POST /api/enhance
Content-Type: application/json

参数：
{
  "filename": "uploaded_file.jpg",
  "type": "brightness|contrast|color|sharpness|auto",
  "intensity": 1.2
}

返回：
{
  "success": true,
  "processed_filename": "processed_file.jpg",
  "enhancement_type": "brightness",
  "intensity": 1.2
}
```

### AI图像分析
```
POST /api/analyze
Content-Type: application/json

参数：
{
  "filenames": ["file1.jpg", "file2.jpg"],
  "criteria": ["composition", "sharpness", "color"]
}

返回：
{
  "success": true,
  "results": [
    {
      "filename": "file1.jpg",
      "score": 8.5,
      "tags": ["构图优秀", "清晰度高", "色彩丰富"],
      "quality": "recommended"
    }
  ]
}
```

### 图片访问
```
GET /api/image/<filename>

返回：图片文件
```

## 评分标准

### 质量等级
- **推荐 (recommended)**：8.5分以上，优质照片
- **良好 (good)**：7.0-8.4分，质量不错的照片
- **一般 (average)**：7.0分以下，普通照片

### 评分维度
- **构图 (composition)**：基于黄金比例和常见构图规则
- **清晰度 (sharpness)**：使用拉普拉斯算子检测图像锐度
- **色彩 (color)**：分析HSV色彩空间的饱和度
- **亮度 (brightness)**：评估图像整体亮度分布

## 支持的文件格式

- **图片格式**：PNG, JPG, JPEG, GIF, WEBP
- **最大文件大小**：16MB
- **推荐分辨率**：1920x1080及以上

## 开发说明

### 开发模式
```bash
# 启动开发服务器
python app.py

# 服务器会在代码更改时自动重启
# Debug模式已启用，可以看到详细错误信息
```

### 生产部署
```bash
# 使用Gunicorn部署
gunicorn -w 4 -b 0.0.0.0:5001 app:app
```

## 注意事项

1. **文件存储**：上传的文件会保存在`uploads/`目录，处理后的文件保存在`processed/`目录
2. **内存使用**：处理大图片时可能占用较多内存，建议适当限制并发处理数量
3. **安全性**：当前版本仅支持图片文件上传，已做基本的文件类型检查
4. **性能优化**：对于生产环境，建议使用专业的WSGI服务器如Gunicorn

## 更新日志

### v1.0.0 (2024-01-XX)
- ✨ 初始版本发布
- ✨ 实现AI修图功能
- ✨ 实现AI选图功能
- ✨ 完整的前后端架构
- ✨ RESTful API接口
- ✨ 响应式Web界面

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目！

---

**AI摄影工具** - 让每一张照片都更出色 📸✨