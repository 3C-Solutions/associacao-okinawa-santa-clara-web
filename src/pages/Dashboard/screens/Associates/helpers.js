export const deptNames = (state, ids) => ids.map((id) => state.departments.find((d) => d.id === id)?.name).filter(Boolean);
