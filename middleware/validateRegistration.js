/**
 * Middleware to validate user registration data
 */
const validateRegistration = (req, res, next) => {
  // name, email, password, dateOfBirth, rank, userType, if userType = organization,organizationName
   const { name, email, password, dateOfBirth, rank, userType, organizationName } = req.body;
   const errors = [];
 
   // Validate name (string)
   if (!name || typeof name !== 'string' || name.trim() === '') {
     errors.push('Name is required and must be a valid string');
   }
 
   // Validate email
   if (!email || typeof email !== 'string' || !email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) {
     errors.push('Please provide a valid email address');
   }
 
   // Validate password
   if (!password || typeof password !== 'string' || password.length < 6) {
     errors.push('Password is required and must be at least 6 characters');
   }
 
   // Validate date of birth
   if (dateOfBirth) {
     const dobDate = new Date(dateOfBirth);
     const today = new Date();
     
     // Check if date is valid
     if (isNaN(dobDate.getTime())) {
       errors.push('Date of birth must be a valid date');
     } 
     // Check if date is in the past
     else if (dobDate >= today) {
       errors.push('Date of birth must be in the past');
     }
     // Check if user is at least 13 years old (common minimum age for online services)
     else {
       const age = today.getFullYear() - dobDate.getFullYear();
       const monthDiff = today.getMonth() - dobDate.getMonth();
       if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
         if (age - 1 < 13) {
           errors.push('You must be at least 13 years old to register');
         }
       } else if (age < 13) {
         errors.push('You must be at least 13 years old to register');
       }
     }
   }
 
   // Validate rank
   if (rank) {
     const validRanks = ['white', 'blue', 'purple', 'brown', 'black'];
     if (!validRanks.includes(rank.toLowerCase())) {
       errors.push('Rank must be one of: white, blue, purple, brown, black');
     }
   }
 
   // Validate user type
   if (!userType || (userType !== 'individual' && userType !== 'organization')) {
     errors.push('User type must be either "individual" or "organization"');
   }
 
   // Validate organization name if user type is organization
   if (userType === 'organization' && (!organizationName || typeof organizationName !== 'string' || organizationName.trim() === '')) {
     errors.push('Organization name is required for organization accounts');
   }
 
   // Return errors if any
   if (errors.length > 0) {
     return res.status(400).json({
       success: false,
       errors
     });
   }
 
   // Proceed to next middleware if validation passes
   next();
 };
 
 module.exports = validateRegistration;
 