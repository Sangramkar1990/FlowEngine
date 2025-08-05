//import share model
const express = require('express');
const Share = require('../models/Share');


//create function to create a new share
exports.createShare = async (req, res) => {
try {
    const { sequence_id, name, entire_org = true, organization_id, team_ids = [] } = req.body;
    if (!sequence_id || !name || !organization_id) {
      return res.status(400).json({ success: false, message: 'sequence_id, name, and organization_id are required' });
    }
    const share = await Share.create({ sequence_id, name, entire_org, organization_id, team_ids });
    res.json({ success: true, share });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

//create function to update a share by share_id
exports.updateShare = async (req, res) => {
   try {
    const { sequence_id } = req.params;
    const { name, entire_org, team_ids } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'name is required' });
    }
    const updated = await Share.updateByShareId(sequence_id, { name, entire_org, team_ids });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Share not found' });
    }
    res.json({ success: true, share: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// create function to get share by sequence_id
exports.getShareBySequenceId = async (req, res) => {
  try {
    const { sequence_id } = req.params;
    const share = await Share.findBySequenceId(sequence_id);
    if (!share) {
      return res.status(404).json({ success: false, message: 'Share not found' });
    }
    res.json({ success: true, share });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}