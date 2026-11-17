import './styles.css';
import AddMarinaCruiseClient from './AddMarinaCruiseClient';
import MarinaCruiseClient from './MarinaCruiseClient';

export default function MarinaCruiseDinnerDashboardPage() {
  return (
    <div className='dashboard_page marina_cruise_page'>
      <MarinaCruiseClient
        title='Marina Cruise Dinner'
        subtitle='Manage marina cruise dinner packages'
        actions={<AddMarinaCruiseClient />}
      />
    </div>
  );
}
