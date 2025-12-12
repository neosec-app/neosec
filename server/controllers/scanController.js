const ScanHistory = require('../models/scanhistory');
const { scanUrl: vtScanUrl, scanIp, getAnalysis } = require('../services/virusTotalService');

// Extract VirusTotal stats
function extractStats(data) {
  try {
    const stats = data.data.attributes.stats;
    const positives = stats.malicious + stats.suspicious;
    const total =
      stats.harmless +
      stats.undetected +
      stats.malicious +
      stats.suspicious;

    return { positives, total };
  } catch (e) {
    return { positives: null, total: null };
  }
}

exports.scanUrl = async (req, res) => {
  try {
    const { url } = req.body;
    const userId = req.user.id;

    if (!url) {
      return res.status(400).json({ message: "URL is required" });
    }

    // Submit URL to VT
    const vtRes = await vtScanUrl(url);
    const scanId = vtRes.data.id;

    // Save initial record (no fullReportUrl yet because analysis not ready)
    await ScanHistory.create({
      userId,
      scanType: 'URL',
      target: url,
      scanId,
      status: 'SCANNING',
      permalink: null
    });

    return res.status(202).json({
      message: 'URL submitted',
      scanId
    });
  } catch (err) {
    console.error(
      "VT URL ERROR:",
      err.response?.status,
      err.response?.data || err.message
    );
    return res.status(500).json({ message: "URL scan failed" });
  }
};

exports.getScanStatus = async (req, res) => {
  try {
    const { scanId } = req.params;
    const userId = req.user.id;

    const record = await ScanHistory.findOne({ where: { userId, scanId } });
    if (!record) return res.status(404).json({ message: "Not found" });

    // If already completed, return DB entry
    if (record.status === 'COMPLETED') {
      return res.json(record);
    }

    // Check VirusTotal status
    const analysis = await getAnalysis(scanId);
    const status = analysis.data.attributes.status;

    if (status === 'completed') {
      const stats = extractStats(analysis);

      // (VT returns GUI URL ID inside meta.url_info.id)
      let fullReportUrl = null;
      try {
        fullReportUrl =
          "https://www.virustotal.com/gui/url/" +
          analysis.data.meta.url_info.id +
          "/detection";
      } catch (e) {
        fullReportUrl = null;
      }

      record.status = "COMPLETED";
      record.positives = stats.positives;
      record.total = stats.total;
      record.permalink = fullReportUrl;
      await record.save();
    }

    return res.json(record);
  } catch (err) {
    console.error("STATUS ERROR:", err);
    return res.status(500).json({ message: "Failed to get status" });
  }
};


exports.getScanHistory = async (req, res) => {
  const scans = await ScanHistory.findAll({ where: { userId: req.user.id } });
  res.json(scans);
};
