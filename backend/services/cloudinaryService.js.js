// backend/services/cloudinaryService.js
// ملاحظة: نحتفظ باسم الملف لتجنب تعديل كل الـ imports في المشروع
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

/**
 * دالة رفع الصور إلى ImgBB
 * @param {string} filePath - مسار الصورة المحلي
 * @returns {Promise<string>} - رابط الصورة المباشر
 */
const uploadToImgBB = async (filePath) => {
  try {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(filePath));

    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 10000,
      }
    );

    if (response.data.success) {
      return response.data.data.url;
    } else {
      throw new Error('ImgBB upload failed: ' + JSON.stringify(response.data));
    }
  } catch (error) {
    console.error('❌ خطأ في رفع الصورة لـ ImgBB:', error.message);
    throw new Error('فشل رفع الصورة: ' + error.message);
  }
};

module.exports = { uploadToImgBB };