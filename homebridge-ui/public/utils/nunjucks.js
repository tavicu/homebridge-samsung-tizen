const nunEnv = new nunjucks.Environment(new nunjucks.WebLoader(''));

nunEnv.addFilter('formatDate', function (value) {
  if (!value) return '';

  const dateObj = new Date(value);

  if (isNaN(dateObj.getTime())) return value;

  return new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).format(dateObj);
});

export async function render(templatePath, data) {
  return new Promise((resolve, reject) => {
    nunEnv.render(templatePath, data, (err, res) => {
      err ? reject(err) : resolve(res);
    });
  });
}
