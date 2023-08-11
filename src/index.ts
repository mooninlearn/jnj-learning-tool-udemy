// import { UDEMY_API_USERNAME, UDEMY_API_PASSWORD } from './globals';
import { UdemyApi } from './UdemyApi';

// console.log(UDEMY_API_USERNAME, UDEMY_API_PASSWORD);
const udemyApi = new UdemyApi('deverlife', '1010586'); // ? Become a WordPress Developer: Unlocking Power With Code
console.log(udemyApi.username);
const data = await udemyApi.fetchCourseInfo();
// const data = await udemyApi.fetchCourseCurriculum();

console.log(data);
