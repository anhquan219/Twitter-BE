// Hàm chuyển enum thành Array number
export const numberEnumtoArray = (numberEnum: { [key: string]: string | number }) => {
  return Object.values(numberEnum).filter((value) => typeof value === 'number') as number[]
}

// Object.values trả về 1 mảng chứa các value của Object đó
