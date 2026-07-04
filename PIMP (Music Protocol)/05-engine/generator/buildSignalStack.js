const { getSongBlueprint } = require("./songBlueprints");

function buildSignalStack(input) {
  return getSongBlueprint(input).signalStack;
}

function deriveConceptProfile(input) {
  return getSongBlueprint(input).conceptProfile;
}

module.exports = {
  buildSignalStack,
  deriveConceptProfile
};
