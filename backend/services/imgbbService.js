const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
require('dotenv').config();

const uploadToImgBB = async (filePath) => {
  if (!process.env.IMGBB_API_KEY) {
    throw new Error('IMGBB_API_KEY غير مهيأ في متغيرات البيئة');
  }

  try {
    const formData = new FormData();
    formData.append('image', fs.readFileSync(filePath).toString('base64'));

    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 15000, // fail fast instead of hanging if ImgBB is unreachable
      }
    );

    if (!response.data || !response.data.success || !response.data.data?.url) {
      throw new Error('ImgBB upload failed: ' + JSON.stringify(response.data));
    }

    return response.data.data.url;
  } catch (error) {
    console.error('❌ خطأ في رفع الصورة لـ ImgBB:', error.message);
    throw new Error('فشل رفع الصورة، يرجى المحاولة لاحقاً');
  } finally {
    // Best-effort cleanup of the temp file written by Multer
    fs.unlink(filePath, () => {});
  }
};

module.exports = { uploadToImgBB };