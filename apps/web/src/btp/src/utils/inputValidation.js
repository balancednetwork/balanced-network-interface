export const composeValidators =
  (...validators) =>
    value =>
      validators.reduce((error, validator) => error || validator(value), undefined);

export const maxValue = (max, msg) => value =>
  Number.isNaN(value) || +value <= +max ? undefined : msg || `Should be less than ${max}`;

export const minValue = (min, msg) => value =>
  !Number.isNaN(value) && +value >= +min ? undefined : msg || `Should be greater than ${min}`;

export const required = value => (value ? undefined : 'Required');
