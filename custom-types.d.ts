export interface message {
  actual: string,
  column: number,
  expected: string[],
  line: number,
  message: string,
  name: string,
  position: position,
  reason: string,
  ruleId: string,
  source: string,
  url: string,
  confidence: number
}

export interface position {
  end: any,
  start: any
}

export interface report {
  data: any,
  messages: message[],
  value: string
}