

export function hasParent(mod: NodeModule){
  const moduleParents = Object.values(require.cache)
  .filter((m) => m && m.children.includes(mod));
  return moduleParents.length > 0
}

export function isNodeEnvironment(){
  return (
    typeof module !== "undefined"
    &&
    typeof process !== "undefined"
    &&
    typeof require !== "undefined"
  );
}
