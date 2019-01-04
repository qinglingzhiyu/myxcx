const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}
const stature = (min,max)=>{
  let array = ["请选择"]
  for (let i = min;i<=max;i++){
     array.push(i+"cm")
  }
  return array
}

module.exports = {
  formatTime: formatTime,
  stature: stature
}
