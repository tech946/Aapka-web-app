import './styles.css';
import AddMarinaCruiseClient from './AddMarinaCruiseClient';
import MarinaCruiseClient from './MarinaCruiseClient';

export default function MarinaCruiseDinnerDashboardPage() {
  return (
    <div className='dashboard_page marina_cruise_page'>
      <div className='heading_block'>
        <h3>Marina Cruise Dinner</h3>
        <p>Manage marina cruise dinner packages</p>
      </div>

      <div className='table_toolbar marina_toolbar'>
        <div />
        <div className='table_actions'>
          <AddMarinaCruiseClient />
        </div>
      </div>

      <MarinaCruiseClient />
    </div>
  );
}
