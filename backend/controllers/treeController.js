const Tree = require('../models/Tree');
const User = require('../models/User');
const { calculateImpact } = require('../services/impactService');
const { uploadToImgBB } = require('../services/imgbbService');
const { containsProfanity } = require('../services/profanityService');
const plantTree = async (req, res) => {
  try {
    const { name, notes, latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Location is required' });
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

    const tree = await Tree.create({
      name: name || '',
      image: imageUrl,
      notes: notes || '',
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      userId: req.user._id,
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { treesCount: 1 } });

    await tree.populate('userId', 'displayName profileImage');
    const { co2Absorbed, o2Produced } = calculateImpact(tree.createdAt);
    res.status(201).json({ ...tree.toObject(), co2Absorbed, o2Produced });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAllTrees = async (req, res) => {
  try {
    const trees = await Tree.find().populate('userId', 'displayName profileImage phone instagramLink');
    const treesWithImpact = trees.map((tree) => {
      const { co2Absorbed, o2Produced } = calculateImpact(tree.createdAt);
      return { ...tree.toObject(), co2Absorbed, o2Produced };
    });
    res.json(treesWithImpact);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMyTrees = async (req, res) => {
  try {
    const trees = await Tree.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const treesWithImpact = trees.map((tree) => {
      const { co2Absorbed, o2Produced } = calculateImpact(tree.createdAt);
      return { ...tree.toObject(), co2Absorbed, o2Produced };
    });
    res.json(treesWithImpact);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
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

    if (containsProfanity(name) || containsProfanity(notes)) {
      return res.status(400).json({ message: 'يحتوي النص على كلمات غير لائقة، يرجى تعديله' });
    }

    if (name !== undefined) tree.name = name;
    if (notes !== undefined) tree.notes = notes;

    if (req.file) {
      tree.image = await uploadToImgBB(req.file.path);
    }

    await tree.save();
    const { co2Absorbed, o2Produced } = calculateImpact(tree.createdAt);
    res.json({ ...tree.toObject(), co2Absorbed, o2Produced });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// الحدود التقريبية للمحافظات العراقية الـ 18 [lng_min, lng_max, lat_min, lat_max]
const GOVERNORATES = [
  { name: 'بغداد',        lngMin: 44.05, lngMax: 44.90, latMin: 33.05, latMax: 33.70 },
  { name: 'صلاح الدين',   lngMin: 43.00, lngMax: 45.00, latMin: 33.70, latMax: 35.30 },
  { name: 'ديالى',        lngMin: 44.85, lngMax: 46.50, latMin: 33.00, latMax: 34.80 },
  { name: 'الأنبار',      lngMin: 38.50, lngMax: 43.20, latMin: 32.00, latMax: 34.50 },
  { name: 'كركوك',        lngMin: 43.50, lngMax: 44.90, latMin: 34.50, latMax: 36.10 },
  { name: 'السليمانية',   lngMin: 44.80, lngMax: 46.50, latMin: 34.80, latMax: 36.40 },
  { name: 'أربيل',        lngMin: 43.50, lngMax: 45.90, latMin: 35.80, latMax: 37.10 },
  { name: 'دهوك',         lngMin: 42.40, lngMax: 43.80, latMin: 36.80, latMax: 37.40 },
  { name: 'نينوى',        lngMin: 41.20, lngMax: 44.30, latMin: 35.30, latMax: 37.40 },
  { name: 'بابل',         lngMin: 44.00, lngMax: 45.00, latMin: 32.30, latMax: 33.05 },
  { name: 'كربلاء',       lngMin: 43.20, lngMax: 44.05, latMin: 32.30, latMax: 33.05 },
  { name: 'واسط',         lngMin: 45.00, lngMax: 46.60, latMin: 32.00, latMax: 33.50 },
  { name: 'القادسية',     lngMin: 44.20, lngMax: 45.60, latMin: 31.50, latMax: 32.30 },
  { name: 'النجف',        lngMin: 43.00, lngMax: 44.60, latMin: 29.50, latMax: 32.30 },
  { name: 'ذي قار',       lngMin: 45.00, lngMax: 47.50, latMin: 30.50, latMax: 32.00 },
  { name: 'ميسان',        lngMin: 46.50, lngMax: 48.00, latMin: 31.50, latMax: 33.00 },
  { name: 'المثنى',       lngMin: 44.00, lngMax: 47.00, latMin: 28.50, latMax: 30.50 },
  { name: 'البصرة',       lngMin: 46.80, lngMax: 48.60, latMin: 29.50, latMax: 31.50 },
];

function getGovernorate(lng, lat) {
  for (const gov of GOVERNORATES) {
    if (lng >= gov.lngMin && lng <= gov.lngMax && lat >= gov.latMin && lat <= gov.latMax) {
      return gov.name;
    }
  }
  return null;
}

const getGovernoratesStats = async (req, res) => {
  try {
    const trees = await Tree.find({}, 'location createdAt');

    const stats = {};

    trees.forEach((tree) => {
      const [lng, lat] = tree.location.coordinates;
      const gov = getGovernorate(lng, lat);
      if (!gov) return;

      if (!stats[gov]) stats[gov] = { name: gov, treesCount: 0, totalCO2: 0, totalO2: 0 };

      const { co2Absorbed, o2Produced } = calculateImpact(tree.createdAt);
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
    res.status(500).json({ message: 'Server error', error: error.message });
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { plantTree, getAllTrees, getMyTrees, updateTree, deleteTree, getGovernoratesStats, getGovTopContributors };