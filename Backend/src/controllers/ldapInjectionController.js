const { testLdapInjection } = require('../services/ldapInjectionService');

async function runLdapInjectionTest(req, res) {
  try {
    const { url, inputs, method, timeoutMs } = req.body || {};

    const result = await testLdapInjection({
      url,
      inputs,
      method,
      timeoutMs
    });

    return res.json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

module.exports = {
  runLdapInjectionTest
};
