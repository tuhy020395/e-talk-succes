import React, { useState, useEffect, useReducer, useRef } from 'react';
import { getListEventsOfWeek } from '~/api/teacherAPI';

import FullCalendar from './FullCalendar';
import dayjs from 'dayjs';
import lottie from '~/node_modules/lottie-web/build/player/lottie.min.js';
import { i18n, withTranslation } from '~/i18n';
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);

const reducer = (prevState, { type, payload }) => {
	switch (type) {
		case 'STATE_CHANGE': {
			return {
				...prevState,
				[payload.key]: payload.value,
			};
			break;
		}
		default:
			return prevState;
			break;
	}
};

//Add hourse Prototype
const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const hotTime = [5, 6, 7, 8, 9, 13, 14, 15, 16];

const BookingCalendar = ({ t }) => {
	const [eventSource, setEventSource] = useState(null);
	const [activeDate, setActiveDate] = useState(new Date());
	const [isLoading, setIsLoading] = useState(true);

	let loadingRef = useRef(true);

	const getEventByWeek = async (date) => {
		setIsLoading(true);

		var curr = new Date(); // get current date
		var first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week
		var last = first + 6; // last day is the first day + 6

		let firstday = new Date(curr.setDate(first + 1)).toUTCString();
		let lastday = new Date(curr.setDate(last + 1)).toUTCString();

		firstday = dayjs(firstday).format('DD/MM/YYYY HH:mm');
		lastday = dayjs(lastday).format('DD/MM/YYYY HH:mm');

		firstday = firstday.split(' ')[0];
		lastday = lastday.split(' ')[0];

		try {
			const res = await getListEventsOfWeek({ start: firstday, end: lastday }); // @string date dd/mm/yyyy
			console.log(res);
			if (res.Code === 200 && res.Data.length > 0) {
				const newEvents = res.Data.map((event) => {
					return {
						...event,
						id: event.BookingID,
						title: event.Title || '',
						start: dayjs(event.Start, 'DD/MM/YYYY HH:mm').toDate(),
						end: dayjs(event.End, 'DD/MM/YYYY HH:mm').toDate(),
						eventType: event.eventType,
						bookStatus: event.bookStatus,
						bookInfo: event.bookInfo,
						available: event.available,
						isEmptySlot: event.isEmptySlot,
					};
				});
				setEventSource(newEvents);
			}
		} catch (error) {
			console.log('Goi API khong thanh cong');
		}
		setIsLoading(false);
	};

	const onSubmit = (e) => {
		e.preventDefault();
	};

	useEffect(() => {
		getEventByWeek({
			UID: 61230,
			start: '01/03/2021',
			end: '08/03/2021',
			Token: '',
		});
		console.log(activeDate);
	}, [activeDate]);

	const cleanUp = () => {
		loadingRef.current && (loadingRef.current = false);
	};

	useEffect(() => {
		lottie &&
			lottie.loadAnimation({
				container: loadingRef.current, // the dom element that will contain the animation
				renderer: 'svg',
				loop: true,
				autoplay: true,
				path: '/static/img/calendar-loading.json', // the path to the animation json
			});

		return cleanUp;
	}, []);

	return (
		<>
			<div className="book__calendar" id="js-book-calendar">
				{isLoading ? (
					<div ref={loadingRef} className="loading-lottie"></div>
				) : (
					<FullCalendar data={eventSource} isLoading={isLoading} />
				)}
			</div>
			<div className="notice pd-20 bg-secondary rounded-5 mg-t-20">
				<h5 className="mg-b-15">
					<i className="fas fa-file"></i> {t('notes')}:
				</h5>
				<ul className="mg-b-0">
					<li>{t('each-slot-is-25-minutes')}.</li>
					<li>
						{t('to-open-a-slot-simply-select-the-time-slot-and-click-on-it')}
					</li>
					<li>
						{t(
							'to-close-a-slot-simple-select-the-time-slot-and-click-close-button',
						)}
					</li>
					<li>
						{t(
							'to-cancel-a-booked-class-select-the-booked-slot-and-click-cancel-the-class',
						)}
					</li>
				</ul>
			</div>
		</>
	);
};

// export default BookingCalendar;
BookingCalendar.getInitialProps = async () => ({
	namespacesRequired: ['common'],
});
export default withTranslation('common')(BookingCalendar);
