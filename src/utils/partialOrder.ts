export function partialsort(array: any[], compare: (a: any, b: any) => number): any[] {
    // TODO: do real partial sort
    return array.sort(compare);
}
// function findMin(array: any[], compare: (a: any, b: any) => number): any {
//   let min = array[0];
//   for (let i = 1; i < array.length; i++) {
//     if (compare(array[i], min) < 0) {
//       min = array[i];
//     }
//   }
//   return min;
// }