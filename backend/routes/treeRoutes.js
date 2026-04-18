const express = require('express');
const router = express.Router();
const {
  plantTree,
  getAllTrees,
  getMyTrees,
  updateTree,
  deleteTree,
  getGovernoratesStats,
  getGovTopContributors,
} = require('../controllers/treeController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../services/uploadService');

router.get('/governorates', getGovernoratesStats);
router.get('/governorates/:name/top', getGovTopContributors);
router.get('/', getAllTrees);
router.get('/my', protect, getMyTrees);
router.post('/', protect, upload.single('image'), plantTree);
router.put('/:id', protect, upload.single('image'), updateTree);
router.delete('/:id', protect, deleteTree);

module.exports = router;