import ExHeader from '../Home/ex/ExHeader';
import ExMotion from '../Home/ex/ExMotion';
import { ExFooter } from '../Home/ex/ExSections';
import { EX_FONTS } from '../Home/ex/fonts';
import AboutEx from './ex/AboutEx';
import '../Home/ex/ex.css';
import './ex/about-ex.css';

export default function AboutPage() {
  return (
    <div className={'desert-ember ex ' + EX_FONTS}>
      <ExHeader />
      <AboutEx />
      <ExFooter />
      <ExMotion />
    </div>
  );
}
