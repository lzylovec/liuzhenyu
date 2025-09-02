from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import uuid
from PIL import Image, ImageEnhance, ImageFilter
import cv2
import numpy as np
from werkzeug.utils import secure_filename
import json
from datetime import datetime
import base64
from io import BytesIO

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 配置
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['PROCESSED_FOLDER'] = 'processed'

# 创建必要的文件夹
for folder in [app.config['UPLOAD_FOLDER'], app.config['PROCESSED_FOLDER']]:
    if not os.path.exists(folder):
        os.makedirs(folder)

# 允许的文件扩展名
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    """检查文件扩展名是否允许"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_unique_filename(filename):
    """生成唯一的文件名"""
    ext = filename.rsplit('.', 1)[1].lower()
    unique_name = str(uuid.uuid4()) + '.' + ext
    return unique_name

@app.route('/')
def index():
    """主页路由"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    """静态文件服务"""
    return send_from_directory('.', filename)

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """文件上传API"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': '没有文件被上传'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': '没有选择文件'}), 400
        
        if file and allowed_file(file.filename):
            # 生成唯一文件名
            filename = get_unique_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            
            # 保存文件
            file.save(filepath)
            
            # 获取图片信息
            with Image.open(filepath) as img:
                width, height = img.size
                format_type = img.format
            
            return jsonify({
                'success': True,
                'filename': filename,
                'original_name': file.filename,
                'size': os.path.getsize(filepath),
                'width': width,
                'height': height,
                'format': format_type,
                'upload_time': datetime.now().isoformat()
            })
        
        return jsonify({'error': '不支持的文件格式'}), 400
        
    except Exception as e:
        return jsonify({'error': f'上传失败: {str(e)}'}), 500

@app.route('/api/image/<filename>')
def get_image(filename):
    """获取图片文件"""
    try:
        # 先检查原始上传文件夹
        if os.path.exists(os.path.join(app.config['UPLOAD_FOLDER'], filename)):
            return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
        # 再检查处理后文件夹
        elif os.path.exists(os.path.join(app.config['PROCESSED_FOLDER'], filename)):
            return send_from_directory(app.config['PROCESSED_FOLDER'], filename)
        else:
            return jsonify({'error': '文件不存在'}), 404
    except Exception as e:
        return jsonify({'error': f'获取图片失败: {str(e)}'}), 500

@app.route('/api/enhance', methods=['POST'])
def enhance_image():
    """AI图像增强API"""
    try:
        data = request.get_json()
        filename = data.get('filename')
        enhancement_type = data.get('type', 'auto')
        intensity = data.get('intensity', 1.2)
        
        if not filename:
            return jsonify({'error': '缺少文件名参数'}), 400
        
        input_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        if not os.path.exists(input_path):
            return jsonify({'error': '源文件不存在'}), 404
        
        # 生成处理后的文件名
        name, ext = os.path.splitext(filename)
        processed_filename = f"{name}_{enhancement_type}_{uuid.uuid4().hex[:8]}{ext}"
        output_path = os.path.join(app.config['PROCESSED_FOLDER'], processed_filename)
        
        # 打开图片
        with Image.open(input_path) as img:
            # 转换为RGB模式（如果需要）
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # 根据增强类型处理图片
            if enhancement_type == 'brightness':
                enhancer = ImageEnhance.Brightness(img)
                img = enhancer.enhance(intensity)
            elif enhancement_type == 'contrast':
                enhancer = ImageEnhance.Contrast(img)
                img = enhancer.enhance(intensity)
            elif enhancement_type == 'color':
                enhancer = ImageEnhance.Color(img)
                img = enhancer.enhance(intensity)
            elif enhancement_type == 'sharpness':
                enhancer = ImageEnhance.Sharpness(img)
                img = enhancer.enhance(intensity)
            elif enhancement_type == 'auto':
                # 自动增强：组合多种效果
                img = ImageEnhance.Brightness(img).enhance(1.1)
                img = ImageEnhance.Contrast(img).enhance(1.2)
                img = ImageEnhance.Color(img).enhance(1.1)
                img = ImageEnhance.Sharpness(img).enhance(1.05)
            
            # 保存处理后的图片
            img.save(output_path, quality=95)
        
        return jsonify({
            'success': True,
            'processed_filename': processed_filename,
            'enhancement_type': enhancement_type,
            'intensity': intensity,
            'process_time': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': f'图像处理失败: {str(e)}'}), 500

@app.route('/api/analyze', methods=['POST'])
def analyze_images():
    """AI图像分析API"""
    try:
        data = request.get_json()
        filenames = data.get('filenames', [])
        criteria = data.get('criteria', ['composition', 'sharpness', 'color'])
        
        if not filenames:
            return jsonify({'error': '没有提供文件名'}), 400
        
        results = []
        
        for filename in filenames:
            input_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            if not os.path.exists(input_path):
                continue
            
            # 分析图片
            score, tags = analyze_single_image(input_path, criteria)
            
            results.append({
                'filename': filename,
                'score': round(score, 1),
                'tags': tags,
                'quality': get_quality_level(score)
            })
        
        # 按分数排序
        results.sort(key=lambda x: x['score'], reverse=True)
        
        return jsonify({
            'success': True,
            'results': results,
            'analysis_time': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': f'图像分析失败: {str(e)}'}), 500

def analyze_single_image(image_path, criteria):
    """分析单张图片的质量"""
    try:
        # 使用OpenCV读取图片
        img = cv2.imread(image_path)
        if img is None:
            return 5.0, ['无法读取']
        
        scores = []
        tags = []
        
        # 清晰度分析
        if 'sharpness' in criteria:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            sharpness_score = min(10, laplacian_var / 100)
            scores.append(sharpness_score)
            
            if sharpness_score > 7:
                tags.append('清晰度高')
            elif sharpness_score > 4:
                tags.append('清晰度中等')
            else:
                tags.append('模糊')
        
        # 色彩分析
        if 'color' in criteria:
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            saturation = np.mean(hsv[:, :, 1])
            color_score = min(10, saturation / 25)
            scores.append(color_score)
            
            if saturation > 100:
                tags.append('色彩丰富')
            elif saturation > 50:
                tags.append('色彩适中')
            else:
                tags.append('色彩单调')
        
        # 构图分析（简化版）
        if 'composition' in criteria:
            height, width = img.shape[:2]
            aspect_ratio = width / height
            
            # 基于黄金比例和常见比例评分
            golden_ratio = 1.618
            ratio_score = 10 - abs(aspect_ratio - golden_ratio) * 2
            ratio_score = max(3, min(10, ratio_score))
            scores.append(ratio_score)
            
            if abs(aspect_ratio - golden_ratio) < 0.2:
                tags.append('构图优秀')
            elif abs(aspect_ratio - 1.5) < 0.2 or abs(aspect_ratio - 1.33) < 0.2:
                tags.append('构图良好')
            else:
                tags.append('构图一般')
        
        # 亮度分析
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        brightness = np.mean(gray)
        if 80 <= brightness <= 180:
            brightness_score = 8
            tags.append('光线良好')
        elif 50 <= brightness <= 220:
            brightness_score = 6
            tags.append('光线适中')
        else:
            brightness_score = 4
            tags.append('光线不佳')
        
        scores.append(brightness_score)
        
        # 计算总分
        final_score = np.mean(scores) if scores else 5.0
        
        # 如果没有标签，添加默认标签
        if not tags:
            tags = ['普通照片']
        
        return final_score, tags
        
    except Exception as e:
        return 5.0, ['分析失败']

def get_quality_level(score):
    """根据分数获取质量等级"""
    if score >= 8.5:
        return 'recommended'
    elif score >= 7.0:
        return 'good'
    else:
        return 'average'

if __name__ == '__main__':
    print("启动AI摄影工具后端服务...")
    print("前端访问地址: http://localhost:5001")
    print("API文档: http://localhost:5001/api")
    app.run(debug=True, host='0.0.0.0', port=5001)