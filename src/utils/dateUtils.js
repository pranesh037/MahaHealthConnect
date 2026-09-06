/**
 * Calculates current age accurately from Date of Birth (dob) or returns stored age.
 * @param {string} dob - Date of birth string (e.g., '1995-04-12')
 * @param {number|string} storedAge - Stored numeric age
 * @returns {number|null} Calculated or stored age
 */
export function calculateAge(dob, storedAge) {
  if (dob) {
    const birthDate = new Date(dob);
    if (!isNaN(birthDate.getTime())) {
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age >= 0) return age;
    }
  }
  if (storedAge !== undefined && storedAge !== null && storedAge !== '') {
    const parsed = parseInt(storedAge, 10);
    if (!isNaN(parsed) && parsed >= 0) return parsed;
  }
  return null;
}
