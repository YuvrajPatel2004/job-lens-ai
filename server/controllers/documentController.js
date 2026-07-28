const Document = require('../models/Document');
const { logActivity } = require('../services/activityService');
const fs = require('fs');
const path = require('path');

// @desc    Create or upload a document
// @route   POST /api/documents
// @access  Private
const createDocument = async (req, res) => {
  try {
    const docData = {
      user: req.user._id,
      title: req.body.title,
      type: req.body.type || 'other',
      job: req.body.job || null,
      content: req.body.content || '',
      tags: req.body.tags
        ? Array.isArray(req.body.tags)
          ? req.body.tags
          : req.body.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
      isGenerated: req.body.isGenerated || false,
    };

    // If file was uploaded
    if (req.file) {
      docData.fileName = req.file.originalname;
      docData.filePath = req.file.path;
      docData.fileSize = req.file.size;
      docData.mimeType = req.file.mimetype;
    }

    const doc = await Document.create(docData);

    await logActivity(req.user._id, {
      job: doc.job,
      type: 'document_added',
      title: `Document added: ${doc.title}`,
      description: `Type: ${doc.type}`,
      metadata: { documentId: doc._id, documentType: doc.type },
    });

    res.status(201).json(doc);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all documents for user
// @route   GET /api/documents
// @access  Private
const getDocuments = async (req, res) => {
  try {
    const query = { user: req.user._id };

    if (req.query.type && req.query.type !== 'all') {
      query.type = req.query.type;
    }
    if (req.query.job) {
      query.job = req.query.job;
    }
    if (req.query.tag) {
      query.tags = { $in: [req.query.tag] };
    }

    const docs = await Document.find(query)
      .populate('job', 'company position')
      .sort({ createdAt: -1 })
      .select('-content');

    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single document
// @route   GET /api/documents/:id
// @access  Private
const getDocument = async (req, res) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate('job', 'company position');

    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update document
// @route   PUT /api/documents/:id
// @access  Private
const updateDocument = async (req, res) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const { title, content, type, tags, job } = req.body;

    if (title !== undefined) doc.title = title;
    if (content !== undefined) doc.content = content;
    if (type !== undefined) doc.type = type;
    if (job !== undefined) doc.job = job || null;
    if (tags !== undefined) {
      doc.tags = Array.isArray(tags)
        ? tags
        : tags.split(',').map((t) => t.trim()).filter(Boolean);
    }

    await doc.save();

    res.json(doc);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete file if it exists
    if (doc.filePath && fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
    }

    await doc.deleteOne();
    res.json({ message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Download document file
// @route   GET /api/documents/:id/download
// @access  Private
const downloadDocument = async (req, res) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (!doc.filePath || !fs.existsSync(doc.filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    res.download(doc.filePath, doc.fileName);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  downloadDocument,
};
