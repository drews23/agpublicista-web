/* Reproduce the current optimizer's default plugin expansion and precision. */
export function svgLabConfig(builtinPlugins, precision = 3) {
  if (!Number.isInteger(precision) || precision < 0 || precision > 8) throw new Error('INVALID_PRECISION');
  const preset = builtinPlugins.find(plugin => plugin.name === 'preset-default');
  if (!preset || !Array.isArray(preset.plugins)) throw new Error('SVGO_PRESET_UNAVAILABLE');
  const selectedPlugins = preset.plugins.map(plugin => plugin.name);
  return {
    selectedPlugins,
    options: {
      multipass: true, floatPrecision: precision, js2svg: {pretty: false, indent: 2},
      plugins: selectedPlugins.map(name => ['cleanupNumericValues','convertPathData','cleanupListOfValues'].includes(name)
        ? {name, params: {floatPrecision: precision}} : name)
    }
  };
}
