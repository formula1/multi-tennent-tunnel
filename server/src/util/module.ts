

export function hasParent(mod: NodeModule){
  const moduleParents = Object.values(require.cache)
  .filter((m) => m && m.children.includes(mod));
  return moduleParents.length > 0
}
