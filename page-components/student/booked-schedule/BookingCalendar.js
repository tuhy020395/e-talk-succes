import React, { useState, useEffect, useReducer, useRef } from 'react';
import { GetBookingCalendarForStudent, GetListTeacher } from '~/api/studentAPI';
import FullCalendar from './FullCalendar';
import dayjs from 'dayjs';
import lottie from '~/node_modules/lottie-web/build/player/lottie.min.js';
import dynamic from 'next/dynamic';
import { appSettings } from '~/config';
import { i18n, withTranslation } from '~/i18n';

import { makeStyles, withStyles } from '@material-ui/core/styles';
import InputLabel from '@material-ui/core/InputLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import NativeSelect from '@material-ui/core/NativeSelect';
import InputBase from '@material-ui/core/InputBase';

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

const BootstrapInput = withStyles((theme) => ({
	root: {
		'label + &': {
			marginTop: theme.spacing(0),
		},
	},
	input: {
		width: '100%',
		borderRadius: 4,
		position: 'relative',
		backgroundColor: theme.palette.background.paper,
		border: '1px solid #ced4da',
		fontSize: 16,
		padding: '10px 26px 10px 12px',
		transition: theme.transitions.create(['border-color', 'box-shadow']),
		// Use the system font instead of the default Roboto font.
		fontFamily: [
			'-apple-system',
			'BlinkMacSystemFont',
			'"Segoe UI"',
			'Roboto',
			'"Helvetica Neue"',
			'Arial',
			'sans-serif',
			'"Apple Color Emoji"',
			'"Segoe UI Emoji"',
			'"Segoe UI Symbol"',
		].join(','),
		'&:focus': {
			borderRadius: 4,
			borderColor: '#fa005e3b',
			boxShadow: '0 0 0 0.2rem #fa005e3b',
			background: 'white',
		},
	},
}))(InputBase);

const useStyles = makeStyles((theme) => ({
	formControl: {
		display: 'inline-block',
		verticalAlign: 'middle',
		margin: theme.spacing(1),

		minWidth: 300,

		'&:focus': {
			'&: label': {
				color: 'black',
			},
		},
	},
	selectEmpty: {
		marginTop: theme.spacing(2),
		'&:before': {
			border: '1px solid black',
		},
	},
	rowInfo: {
		display: 'flex',
		alignItems: 'center',
		marginBottom: '20px',
	},
	styleInput: {
		marginTop: '0px',
		opacity: '1',
		top: '50%',
		zIndex: '99999',
		transform: 'translateY(-50%)',
		left: '10px',
		color: '#424242',
		fontSize: '15px',
	},
	titleForm: {
		display: 'inline-block',
		verticalAlign: 'middle',
		marginBottom: '0',
		color: '#fa005e',
		fontWeight: 'bold',
		marginRight: '10px',
	},
	boxSelect: {
		marginLeft: '100px',
	},
}));

const NoSSRCalendar = dynamic(import('./FullCalendar'), { ssr: false });

//Add hourse Prototype
const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const hotTime = [5, 6, 7, 8, 9, 13, 14, 15, 16];

const BookingCalendar = ({ t }) => {
	const [eventSource, setEventSource] = useState(null);
	const [activeDate, setActiveDate] = useState(new Date());
	const [isLoading, setIsLoading] = useState(true);

	const [dataTeacher, setDataTeacher] = useState();
	const [onFetching, sOnFetching] = useState(false);

	// Style Select Material

	const classes = useStyles();
	const [teacher, setTeacher] = useState('');

	// -------

	let loadingRef = useRef(true);

	// Get Event Week
	const getEventByWeek = async (obj, callback) => {
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
			const res = await GetBookingCalendarForStudent({
				TeacherID: obj.TeacherID,
				Token: obj.Token,
				start: firstday,
				end: lastday,
				UID: obj.UID,
			}); // @string date dd/mm/yyyy
			if (res.Code === 200) {
				const newEvents = res.Data.map((event) => {
					return {
						...event,
						id: event.BookingID,
						title: event.title || '',
						start: dayjs(event.Start, 'YYYY-MM-DDTHH:mm').toDate(),
						end: dayjs(event.End, 'YYYY-MM-DDTHH:mm').toDate(),
						eventType: event.eventType,
						bookStatus: event.bookStatus,
						bookInfo: event.bookInfo,
						available: event.available,
						isEmptySlot: event.isEmptySlot,
					};
				});
				setEventSource([...newEvents]);
			}
		} catch (error) {
			console.log('Goi API khong thanh cong');
		}
	};

	useEffect(() => {
		if (eventSource) {
			setIsLoading(false);
			sOnFetching(false);
		}
	}, [eventSource]);

	const onSubmit = (e) => {
		e.preventDefault();
	};

	// useEffect(() => {
	// 	getEventByWeek({
	// 		TeacherUID: '61230',
	// 		Start: '21/02/2021',
	// 		End: '28/02/2021',
	// 		UID: '61215',
	// 		Token: '',
	// 		Page: 1,
	// 	});

	// }, [activeDate]);

	const cleanUp = () => {
		loadingRef.current && (loadingRef.current = false);
	};

	useEffect(() => {
		if (localStorage.getItem('isLogin')) {
			let UID = localStorage.getItem('UID');
			let Token = localStorage.getItem('token');

			// Get list Teacher
			(async () => {
				try {
					const res = await GetListTeacher({ UID, Token });

					if (res.Code === 200) {
						setDataTeacher(res.Data);
						setTeacher(res.Data[0].TeacherID);
						// getEventByWeek({
						// 	TeacherID: parseInt(res.Data[0].TeacherID),
						// 	UID: UID,
						// 	Token: Token,
						// 	Page: 1,
						// });
					} else {
						alert('L???i load danh s??ch gi??o vi??n');
					}
				} catch (error) {
					console.log(error);
				}
			})();
		}

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

	// useEffect(() => {
	// 	if (localStorage.getItem('isLogin')) {
	// 		let UID = localStorage.getItem('UID');
	// 		let Token = localStorage.getItem('token');

	// 		if (teacher !== '') {
	// 			getEventByWeek({
	// 				TeacherID: teacher,
	// 				UID: UID,
	// 				Token: Token,
	// 				Page: 1,
	// 			});
	// 		}
	// 	}
	// }, [teacher]);

	useEffect(() => {
		if (onFetching) {
			let UID = localStorage.getItem('UID');
			let Token = localStorage.getItem('token');
			getEventByWeek({
				TeacherID: parseInt(teacher),
				UID: UID,
				Token: Token,
				Page: 1,
			});
		}
	}, [onFetching]);

	useEffect(() => {
		teacher && sOnFetching(true);
	}, [teacher]);

	return (
		<>
			<div className={`user-slot-summary ${classes.rowInfo}`}>
				<div className="box-info">
					<p className="mg-b-5">
						{t('your-package-total-classes')} :{' '}
						<span className="tx-bold tx-primary">50</span>
					</p>
					<p style={{ marginBottom: '0' }}>
						{t('classes-were-booked')} :{' '}
						<span className="tx-bold tx-primary">26 / 50</span>
					</p>
				</div>
				<div className={classes.boxSelect}>
					<p className={classes.titleForm}>Ch???n gi??o vi??n</p>
					<FormControl className={`${classes.margin} ${classes.formControl}`}>
						{/* <InputLabel
							htmlFor="demo-customized-select-native"
							className={classes.styleInput}
							style={{ opacity: teacher !== '' && '0' }}
						>
							Ch???n Gi??o vi??n
						</InputLabel> */}
						<NativeSelect
							id="demo-customized-select-native"
							value={teacher}
							onChange={({ target: { value } }) => setTeacher(value)}
							input={<BootstrapInput />}
						>
							{dataTeacher?.map((item) => (
								<option key={item.TeacherID} value={item.TeacherID}>
									{item.TeacherName}
								</option>
							))}
						</NativeSelect>
					</FormControl>
				</div>
			</div>
			<div className="book__calendar" id="js-book-calendar">
				{isLoading ? (
					<div ref={loadingRef} className="loading-lottie"></div>
				) : (
					<>
						<NoSSRCalendar
							teacher={teacher}
							data={[...eventSource]}
							isLoading={isLoading}
							completeBooking={() => {
								localStorage?.getItem('UID') &&
									localStorage?.getItem('token') &&
									getEventByWeek({
										TeacherID: Number(teacher),
										UID: localStorage?.getItem('UID'),
										Token: localStorage?.getItem('token'),
										Page: 1,
									});
							}}
						/>
					</>
				)}
			</div>
			<div className="notice pd-20 bg-secondary rounded-5 mg-t-20">
				<h5 className="mg-b-15">
					<i className="fas fa-file"></i> {t('notes')}
				</h5>

				<ul className="mg-b-0">
					<li>{t('each-slot-is-25-minutes')}.</li>
					<li>
						{t(
							'to-close-a-slot-simple-select-the-time-slot-and-click-close-button',
						)}
					</li>
					<li>
						{t(
							'to-cancel-a-booked-class-select-the-booked-slot-and-click-cancel-the-class',
						)}
						.
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
