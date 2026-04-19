// BAD: undefined variable — no-undef
async function handler(req, res) {
  const result = undefinedHelper.doSomething();
  res.json(result);
}
module.exports = { handler };
