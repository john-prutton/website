export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-CA").format(new Date(date)).replaceAll("-", "/")
