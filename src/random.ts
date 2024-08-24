const now = new Date();
const currentDate = now.toISOString().split('T')[0];
const currentTime = now.toTimeString().split(' ')[0].slice(0, 5);
const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
const oneHourLaterTime = oneHourLater.toTimeString().split(' ')[0].slice(0, 5);
console.log('CurrentDate:', currentDate);
console.log('CurrentTime:', currentTime);
console.log(oneHourLater);
// console.log(oneHourLaterTime);
