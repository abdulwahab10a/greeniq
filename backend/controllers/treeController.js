const Tree = require('../models/Tree');
const User = require('../models/User');
const { calculateImpact } = require('../services/impactService');
const { uploadToImgBB } = require('../services/imgbbService');
const { containsProfanity } = require('../services/profanityService');
const { GOVERNORATES, getGovernorate } = require('../services/governorateService');
const plantTree = async (req, res) => {
  try {
    const { name, notes, latitude, longitude, ageAtPlanting } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Location is required' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ message: 'إحداثيات الموقع غير صالحة' });
    }
    if (name && name.length > 100) {
      return res.status(400).json({ message: 'اسم الشجرة يجب ألا يتجاوز 100 حرف' });
    }
    if (notes && notes.length > 500) {
      return res.status(400).json({ message: 'الملاحظات يجب ألا تتجاوز 500 حرف' });
    }

    if (containsProfanity(name) || containsProfanity(notes)) {
      return res.status(400).json({ message: 'يحتوي النص على كلمات غير لائقة، يرجى تعديله' });
    }

    const nearby = await Tree.findOne({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          $maxDistance: 2,
        },
      },
    });

    if (nearby) {
      return res.status(400).json({ message: 'يوجد شجرة على بُعد أقل من 2 متر من هذا الموقع، اختر موقعاً أبعد' });
    }

    let imageUrl = '';
    if (req.file) {
      imageUrl = await uploadToImgBB(req.file.path);
    }

    const ageInDays = ageAtPlanting ? Math.round(parseFloat(ageAtPlanting) * 365) : 0;

    const tree = await Tree.create({
      name: name || '',
      image: imageUrl,
      notes: notes || '',
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      userId: req.user._id,
      ageAtPlanting: ageInDays,
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { treesCount: 1 } });

    await tree.populate('userId', 'displayName profileImage');
    const { co2Absorbed, o2Produced } = calculateImpact(tree.createdAt, tree.ageAtPlanting);
    res.status(201).json({ ...tree.toObject(), co2Absorbed, o2Produced });
  } catch (error) {
    console.error('Tree error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً' });
  }
};

const getAllTrees = async (req, res) => {
  try {
    const trees = await Tree.find().populate('userId', 'displayName profileImage phone instagramLink');
    const treesWithImpact = trees.map((tree) => {
      const { co2Absorbed, o2Produced } = calculateImpact(tree.createdAt, tree.ageAtPlanting);
      return { ...tree.toObject(), co2Absorbed, o2Produced };
    });
    res.json(treesWithImpact);
  } catch (error) {
    console.error('Tree error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً' });
  }
};

const getMyTrees = async (req, res) => {
  try {
    const trees = await Tree.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const treesWithImpact = trees.map((tree) => {
      const { co2Absorbed, o2Produced } = calculateImpact(tree.createdAt, tree.ageAtPlanting);
      return { ...tree.toObject(), co2Absorbed, o2Produced };
    });
    res.json(treesWithImpact);
  } catch (error) {
    console.error('Tree error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً' });
  }
};

const updateTree = async (req, res) => {
  try {
    const tree = await Tree.findById(req.params.id);
    if (!tree) return res.status(404).json({ message: 'Tree not found' });

    if (tree.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { name, notes } = req.body;

    if (name && name.length > 100) {
      return res.status(400).json({ message: 'اسم الشجرة يجب ألا يتجاوز 100 حرف' });
    }
    if (notes && notes.length > 500) {
      return res.status(400).json({ message: 'الملاحظات يجب ألا تتجاوز 500 حرف' });
    }

    if (containsProfanity(name) || containsProfanity(notes)) {
      return res.status(400).json({ message: 'يحتوي النص على كلمات غير لائقة، يرجى تعديله' });
    }

    if (name !== undefined) tree.name = name;
    if (notes !== undefined) tree.notes = notes;

    if (req.file) {
      tree.image = await uploadToImgBB(req.file.path);
    }

    await tree.save();
    const { co2Absorbed, o2Produced } = calculateImpact(tree.createdAt, tree.ageAtPlanting);
    res.json({ ...tree.toObject(), co2Absorbed, o2Produced });
  } catch (error) {
    console.error('Tree error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً' });
  }
};

const deleteTree = async (req, res) => {
  try {
    const tree = await Tree.findById(req.params.id);
    if (!tree) return res.status(404).json({ message: 'Tree not found' });

    if (tree.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await tree.deleteOne();
    await User.findByIdAndUpdate(req.user._id, { $inc: { treesCount: -1 } });
    res.json({ message: 'Tree deleted successfully' });
  } catch (error) {
    console.error('Tree error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً' });
  }
};

const getGovernoratesStats = async (req, res) => {
  try {
    const trees = await Tree.find({}, 'location createdAt ageAtPlanting');

    const stats = {};

    trees.forEach((tree) => {
      const [lng, lat] = tree.location.coordinates;
      const gov = getGovernorate(lng, lat);
      if (!gov) return;

      if (!stats[gov]) stats[gov] = { name: gov, treesCount: 0, totalCO2: 0, totalO2: 0 };

      const { co2Absorbed, o2Produced } = calculateImpact(tree.createdAt, tree.ageAtPlanting);
      stats[gov].treesCount += 1;
      stats[gov].totalCO2  += co2Absorbed;
      stats[gov].totalO2   += o2Produced;
    });

    const result = Object.values(stats)
      .map(g => ({
        ...g,
        totalCO2: parseFloat(g.totalCO2.toFixed(2)),
        totalO2:  parseFloat(g.totalO2.toFixed(2)),
      }))
      .sort((a, b) => b.treesCount - a.treesCount)
      .slice(0, 10);

    res.json(result);
  } catch (error) {
    console.error('Tree error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً' });
  }
};

const getGovTopContributors = async (req, res) => {
  try {
    const govName = decodeURIComponent(req.params.name);
    const gov = GOVERNORATES.find(g => g.name === govName);
    if (!gov) return res.status(404).json({ message: 'Governorate not found' });

    const trees = await Tree.find({
      location: {
        $geoWithin: {
          $box: [
            [gov.lngMin, gov.latMin],
            [gov.lngMax, gov.latMax],
          ],
        },
      },
    }).populate('userId', 'displayName profileImage userId');

    const userMap = {};
    trees.forEach((tree) => {
      if (!tree.userId) return;
      const uid = tree.userId._id.toString();
      if (!userMap[uid]) {
        userMap[uid] = {
          _id: tree.userId._id,
          displayName: tree.userId.displayName,
          profileImage: tree.userId.profileImage,
          userId: tree.userId.userId,
          count: 0,
        };
      }
      userMap[uid].count++;
    });

    const top3 = Object.values(userMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    res.json(top3);
  } catch (error) {
    console.error('Tree error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً' });
  }
};

const getSiteStats = async (req, res) => {
  try {
    const trees = await Tree.find({}, 'createdAt ageAtPlanting');
    let totalCO2 = 0, totalO2 = 0;
    trees.forEach(tree => {
      const { co2Absorbed, o2Produced } = calculateImpact(tree.createdAt, tree.ageAtPlanting);
      totalCO2 += co2Absorbed;
      totalO2  += o2Produced;
    });
    res.json({
      totalTrees: trees.length,
      totalCO2: parseFloat(totalCO2.toFixed(1)),
      totalO2:  parseFloat(totalO2.toFixed(1)),
    });
  } catch (error) {
    console.error('Tree error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً' });
  }
};

module.exports = { plantTree, getAllTrees, getMyTrees, updateTree, deleteTree, getGovernoratesStats, getGovTopContributors, getSiteStats };