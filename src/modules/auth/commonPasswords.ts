/**
 * Small deny-list of the most common passwords. Not exhaustive — a stand-in for a
 * fuller list (e.g. the SecLists "10k-most-common"). Comparison is lower-cased.
 */
const COMMON = new Set([
  'password', 'password1', 'password123', 'passw0rd', 'p@ssw0rd', 'p@ssword',
  '12345678', '123456789', '1234567890', '11111111', '00000000', '123123123',
  'qwertyuiop', 'qwerty123', 'qwertyui', 'asdfghjkl', '1q2w3e4r', '1qaz2wsx',
  'iloveyou', 'letmein123', 'welcome1', 'welcome123', 'admin123', 'administrator',
  'sunshine1', 'football1', 'baseball1', 'trustno1', 'whatever1', 'princess1',
  'dragon123', 'monkey123', 'superman1', 'batman123', 'master123', 'shadow123',
  'abc12345', 'abcd1234', 'test1234', 'changeme', 'changeme123', 'secret123',
  'bassera123', 'basseraagency', 'letmein2024', 'password2024', 'password2025',
])

export function isCommonPassword(password: string): boolean {
  return COMMON.has(password.toLowerCase())
}
