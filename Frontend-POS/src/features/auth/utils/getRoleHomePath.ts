// Single source of truth for "where does this role land by default".
// Used by both LoginPage (after a fresh login) and RootRedirect
// (when someone already has a valid session and hits "/").
export const getRoleHomePath = (role?: string): string => {
  switch (role) {
    case "Admin":
      return "/admin";
    case "Cashier":
      return "/cashier";
    case "Customer":
      return "/menu";
    default:
      return "/login";
  }
};
