import { readFileSync } from 'fs';
import path from 'path';
import 'regenerator-runtime/runtime';
import ejs from 'ejs';
import wixRunMode from 'wix-run-mode';
import wixExpressCsrf from 'wix-express-csrf';
import wixExpressRequireHttps from 'wix-express-require-https';

const artifactName = '{%projectName%}';
const artifactId = `com.wixpress.${artifactName}`;

module.exports = (app, context) => {
  const config = context.config.load(artifactName);
  const templatePath = './src/index.ejs';
  const templateFile = readFileSync(templatePath, 'utf8');
  const isProduction = wixRunMode.isProduction();

  app.use(wixExpressCsrf());
  app.use(wixExpressRequireHttps);

  app.get('/', context.hadron.middleware(), (req, res, next) => {
    const hadron = res.locals.hadron;
    const renderModel = getRenderModel(req, hadron);
    const templatePath = path.join(hadron.staticLocalPath(artifactId, './src'), 'index.ejs');
    ejs.renderFile(templatePath, renderModel, { cache: isProduction }, (err, html) => {
      err ? next(err) : res.send(html);
    });
  });

  function getRenderModel(req, hadron) {
    return {
      locale: req.aspects['web-context'].language,
      basename: req.aspects['web-context'].basename,
      debug:
        req.aspects['web-context'].debug ||
        process.env.NODE_ENV === 'development',
      clientTopology: {
        ...config.clientTopology,
        staticsBaseUrl: hadron.staticUrl(artifactId, config.clientTopology.staticsBaseUrl)
      },
      title: 'Wix Full Stack Project Boilerplate',
    };
  }

  return app;
};
