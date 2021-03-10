import lottie from '~/node_modules/lottie-web/build/player/lottie.min.js';
import React, { useState, useEffect, useReducer, useRef } from 'react';
import {
	getListEventsOfWeek,
	setEventAvailable,
	setEventClose,
	addScheduleLog,
	cancelSlotByDate,
} from '~/api/teacherAPI';
import ActiveSlotModal from './ActiveSlotModal';
import CloseSlotModal from './CloseSlotModal';
import CancelSlotModal from './CancelSlotModal';
import { appSettings } from '~/config';
import { toast } from 'react-toastify';
import { Modal, Button } from 'react-bootstrap';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { getDifferentMinBetweenTime, convertDDMMYYYYtoMMDDYYYY } from '~/utils';
import { randomId } from '~/utils';
import dayjs from 'dayjs';
// import '@fortawesome/fontawesome-free';
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);

const pad = (n) => (n >= 10 ? n : '0' + n);

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

// const hotTime = [5, 6, 7, 8, 9, 13, 14, 15, 16];

// const date = new Date();
// const d = date.getDate();
// const m = date.getMonth() + 1;
// const y = date.getFullYear();

const formatDateString = (dateStr) => {
	return dayjs(dateStr).format('DD/MM/YYYY');
};

const initEvents = [];

let calendar = null;

const FullCalendar = ({ data = [] }) => {
	const [eventSource, setEventSource] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [showErrorBook, setShowErrorBook] = useState(false);
	const [showActiveModal, setShowActiveModal] = useState(false);
	const [showCancelModal, setShowCancelModal] = useState(false);
	const [modalData, setModalData] = useState(null);

	const [statusBooking, setStatusBooking] = useState(false);

	const loadingRef = useRef(true);

	const [cancelLoading, setCancelLoading] = useState(false);

	const [getOpenID, setOpenID] = useState();

	const [dateCalendar, setDateCalendar] = useState({
		start: null,
		end: null,
	});

	// console.log('date Calendar ', dateCalendar);

	const [getDataAPI, setDataAPI] = useState();

	// console.log('GET data API: ', getDataAPI);

	const fetchEventByDate = async (obj) => {
		setIsLoading(true);

		try {
			const res = await getListEventsOfWeek({
				UID: obj.UID,
				start: obj.start,
				end: obj.end,
				Token: obj.Token,
			}); // @string date dd/mm/yyyyBookingStatusBookingStatus
			if (res.Code === 200 && res.Data.length > 0) {
				setDataAPI(res.Data);

				// calendar.addEventSource(showData());
				// Hồi nãy nó có filter nữa nên nó chỉ lấy mấy cái empty, nên cái có data k showw
				const newEvents = res.Data.map((event, i) => {
					return {
						...event,
						id: i,
						title: event.Title || '',
						OpenID: event.OpenID,
						start: dayjs(event.StartDate, 'DD/MM/YYYY HH:mm').toDate(),
						end: dayjs(event.EndDate, 'DD/MM/YYYY HH:mm').toDate(),
						eventType: event.eventType,
						bookStatus: event.BookingStatus,
						bookInfo: event.bookInfo,
						available: event.available,
						isEmptySlot: event.isEmptySlot,
						loading: false,
					};
					console.log(event);
				});

				const sources = calendar.getEventSources();

				if (sources.length > 0) {
					sources[0].remove();
					console.log('SOURCE nè: ', sources);
					calendar.addEventSource(newEvents);
				}
			}
		} catch (error) {
			console.log('Error: ', error);
		}
		setIsLoading(false);

		// console.log('After save: ', calendar.getEventSources());
	};

	const callFetchEvent = (date) => {
		let UID = null;
		let Token = null;

		// GET UID and Token
		if (localStorage.getItem('UID')) {
			UID = localStorage.getItem('UID');
			Token = localStorage.getItem('token');
		}

		// GET DATE
		let cur = new Date();

		let getDate = date.getDate();
		let testDate = new Date(cur.setDate(getDate + 6)).toUTCString();

		let start = dayjs(date).format('DD/MM/YYYY');
		let end = dayjs(testDate).format('DD/MM/YYYY');

		// ----

		fetchEventByDate({
			UID: UID,
			start: start,
			end: end,
			Token: Token,
		});
	};

	const triggerNextCalendar = () => {
		calendar.refetchEvents();

		if (!calendar) return;
		try {
			const currentDate = calendar.getDate();

			callFetchEvent(currentDate);
		} catch (error) {}
	};

	const triggerPrevCalendar = () => {
		calendar.refetchEvents();
		if (!calendar) return;
		try {
			const currentDate = calendar.getDate();

			callFetchEvent(currentDate);
		} catch (error) {}
	};

	const triggerTodayCalendar = () => {
		calendar.refetchEvents();
		if (!calendar) return;
		try {
			const currentDate = calendar.getDate();

			callFetchEvent(currentDate);
		} catch (error) {}
	};

	const closeAvailableEvent = (newProps, eventsArray) => {
		const newSources = [...eventsArray].map((event) =>
			event.StudyTimeID === newProps.StudyTimeID &&
			event.Start === newProps.Start
				? {
						...event,
						available: false,
						bookStatus: false,
						isEmptySlot: true,
				  }
				: event,
		);
		setEventSource(newSources);
	};

	const cancelBookedEvent = (newProps) => {
		const { StudyTimeID, Start } = newProps;
		const newSources = [...eventSource].map((event) =>
			event.StudyTimeID === StudyTimeID && event.Start === Start
				? {
						...event,
						available: false,
						bookStatus: false,
						isEmptySlot: true,
						bookInfo: null,
				  }
				: event,
		);
		setEventSource(newSources);
	};

	const onViewChange = (view, el) => {
		console.log({ view, el });
	};

	const funcGetOpenID = async (obj) => {
		let rs = null;
		console.log('Obj in func', obj);
		try {
			const res = await setEventAvailable({
				start: obj.start,
				end: obj.end,
			});
			if (res.Code === 200) {
				rs = res.Data;
			} else {
				alert('Lỗi không lấy được Open ID');
			}
		} catch (error) {
			console.log(error);
		}
		return rs;
	};

	const _openSlot = async () => {
		let start = dayjs(modalData.start).toDate();
		let end = dayjs(modalData.end).toDate();

		start = dayjs(start).format('DD/MM/YYYY HH:mm');
		end = dayjs(end).format('DD/MM/YYYY HH:mm');

		console.log('Start nè: ', start);
		console.log('End nè: ', end);

		let getOpenID = null;
		let openID = funcGetOpenID({ start, end });
		openID.then(function (value) {
			console.log('VALUEEE: ', value);

			try {
				calendar.addEvent(
					{
						id: randomId(),
						BookingID: 0,
						start: dayjs(modalData.start).toDate(),
						end: dayjs(modalData.end).toDate(),
						OpenID: value,
						StudyTimeID: 1,
						TeacherEnd: modalData.start,
						TeacherStart: modalData.end,
						TeacherUID: 20,
						available: true,
						bookInfo: null,
						bookStatus: false,
						eventType: 0,
						isEmptySlot: false,
						title: null,
						loading: true,
					},
					true,
				);
				setShowActiveModal(false);
			} catch (error) {
				console.log('Error openSlot !', error);
				alert('Open slot failed !!');
			}
		});

		// ----
		// fetchEventByDate({
		// 	UID: 61230,
		// 	start: '01/03/2021',
		// 	end: '08/03/2021',
		// 	Token: '',
		// });
		// initCalendar();

		// setTimeout(() => {
		// 	calendar.render();
		// }, 500);
	};

	const afterEventAdded = async (eventInfo) => {
		let event = eventInfo.event;

		console.log('event range', event.start, event.end);

		let start = dayjs(event.start).toDate();
		let end = dayjs(event.end).toDate();

		start = dayjs(start).format('DD/MM/YYYY HH:mm');
		end = dayjs(end).format('DD/MM/YYYY HH:mm');

		console.log('Start nè: ', start);
		console.log('End nè: ', end);

		const res = await setEventAvailable({
			start: start,
			end: end,
		});
		if (res.Code === 200) {
			event.setExtendedProp('loading', false);
		} else {
			// eventApi.remove();
			eventInfo.revert();
			toast.error('Open slot failed', {
				position: toast.POSITION.TOP_RIGHT,
				autoClose: 2000,
			});
			console.log('Loi khi goi api');
		}
	};

	// const _closeSlot = async (event) => {
	// 	let eventInstance = calendar.getEventById(event.id);
	// 	if (eventInstance) eventInstance.remove();
	// 	eventInstance.remove();
	// };
	const showCancelReasonModal = (event) => {
		console.log(showCancelReasonModal);
		try {
			event.preventDefault();
			const cancelBtn = event.target;
			const eventId = cancelBtn.dataset.schedule;
			setModalData({
				...modalData,
				eventId,
			});
			setShowCancelModal(true);
		} catch (error) {
			console.log(error);
		}
		// setIsLoading(true);
		// try {
		// 	const res = await cancelLesson({
		// 		BookingID: data.BookingID,
		// 		ReasonCancleOfTeacher: data.reason,
		// 	});
		// 	if (res.Code === 1) {
		// 		cancelBookedEvent(data);
		// 		toast.success('You have canceled a lesson successfully', {
		// 			position: toast.POSITION.TOP_CENTER,
		// 			autoClose: 2000,
		// 		});
		// 	} else {
		// 		toast.error(res?.Message ?? 'Cancel slot failed', {
		// 			position: toast.POSITION.TOP_CENTER,
		// 			autoClose: 2000,
		// 		});
		// }
		// } catch (error) {
		// 	console.log('Error openSlot !', error);
		// }
		// setIsLoading(false);
	};

	const onSubmit = (e) => {
		e.preventDefault();
	};

	const viewRender = (view, element) => {
		console.log('Elenment: ', element);
		console.log('VIEW: ', view);
	};

	const emptyCellSelect = (selection) => {
		console.log('Selection: ', selection);

		// getID_afterClick(selection);

		setModalData({
			start: selection.startStr,
			end: selection.endStr,
		});
		setShowActiveModal(true);
	};

	let $toggleCheckbox;

	const getSpaceDate = () => {
		var curr = new Date(); // get current date
		var first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week
		var last = first + 6; // last day is the first day + 6

		let firstday = new Date(curr.setDate(first + 1)).toUTCString();
		let lastday = new Date(curr.setDate(last + 1)).toUTCString();

		firstday = dayjs(firstday).format('DD/MM/YYYY HH:mm');
		lastday = dayjs(lastday).format('DD/MM/YYYY HH:mm');

		firstday = firstday.split(' ')[0];
		lastday = lastday.split(' ')[0];

		fetchEventByDate({
			UID: 61230,
			start: firstday,
			end: lastday,
			Token: '',
		});

		// setDateCalendar({
		// 	start: firstday,
		// 	end: lastday,
		// });
	};

	const initCalendar = () => {
		//const createEventSlots
		const calendarEl = document.getElementById('js-book-calendar');

		const $closeModal = $('#md-close-slot');
		const $cancelModal = $('#md-cancel-slot');

		const eventDidMount = (args) => {
			// console.log('eventDidMount', args);
			const { event, el } = args;

			// console.log('Event in eventdidmount: ', event);

			const data = {
				...event.extendedProps,
				id: event.id,
				start: event.StartDate,
				end: event.EndDate,
				teacherName: event.TeacherName,
				StudentName: event.StudentName,
				className: event.ClassName,
				studentCode: event.StudentCode,
				program: event.Program,
				homeWork: event.HomeWork,
				studentSkype: event.StudentSkype,
			};

			// console.log('Start day: ', data.start);

			// setDateCalendar({
			// 	start: data.start,
			// 	end: data.end,
			// });

			// fetchEventByDate({
			// 	UID: 61230,
			// 	start: data.start,
			// 	end: data.end,
			// 	Token: '',
			// });

			el.setAttribute('tabindex', -1);
			if (!args.isPast && ![...el.classList].includes('booked-slot')) {
				// $(el).tooltip({
				// 	html: true,
				// 	title: `
				//             <p class="mg-b-0 tx-nowrap">Your time: ${dayjs(
				// 							event.extendedProps?.TeacherStart ?? new Date(),
				// 						).format('DD/MM/YYYY hh:mm A')}</p>
				//               <p class="mg-b-0 tx-nowrap">VN time: ${dayjs(
				// 								event.start,
				// 							).format('DD/MM/YYYY hh:mm A')}</p>
				//         `,
				// 	animation: false,
				// 	template: `<div class="tooltip" role="tooltip">
				//             <div class="tooltip-arrow">
				//             </div>
				//             <div class="tooltip-inner">
				//             </div>
				//           </div>`,
				// 	trigger: 'hover',
				// });
			}

			const diff = getDifferentMinBetweenTime(
				new Date(),
				new Date(event.StartDate),
			);

			console.log('Diff: ', diff);

			const popWhitelist = $.fn.tooltip.Constructor.Default.whiteList; //White list data attribute;
			popWhitelist.a.push('data-skype');
			popWhitelist.a.push('data-schedule');
			popWhitelist.a.push('disabled');
			const cancelable = diff > 60 ? true : false;
			!!el &&
				[...el.classList].includes('booked-slot') &&
				$(el)
					.popover({
						html: true,
						container: 'body',
						trigger: 'focus',
						title: event.extendedProps.bookInfo?.timeZone ?? 'GTM + 7',
						content: `
								<p class="mg-b-5 tx-light"><span class="mg-r-5">Teacher Name:</span><span class="tx-medium">${
									event.extendedProps.TeacherName ?? ''
								}</span></p>
								<p class="mg-b-5 tx-light"><span class="mg-r-5">Student:</span><span class="tx-medium">${
									event.extendedProps.StudentName ?? ''
								}</span></p>
								<p class="mg-b-5 tx-light"><span class="mg-r-5">ClassName:</span><span class="tx-medium">${
									event.extendedProps.ClassName ?? ''
								}</span></p>
		            <p class="mg-b-5 tx-light"><span class="mg-r-5">Student Code:</span><span class="tx-medium">${
									event.extendedProps.StudentCode ?? ''
								}</span></p>
		            <p class="mg-b-5 tx-light"><span class="mg-r-5">Program:</span><span class="tx-medium">${
									event.extendedProps.Program ?? ''
								}</span></p>
								<p class="mg-b-5 tx-light"><span class="mg-r-5">HomeWork:</span><span class="tx-medium">${
									event.extendedProps.HomeWork ?? ''
								}</span></p>
		            <p class="mg-b-5 tx-light"><span class="mg-r-5">Start Date:</span><span class="tx-medium">${dayjs(
									event.extendedProps.StartDate,
								).format('DD/MM/YYYY hh:mm A')}</span></p>
		            <p class="mg-b-5 tx-light"><span class="mg-r-5">End Date:</span><span class="tx-medium">${dayjs(
									event.extendedProps.EndDate,
								).format('DD/MM/YYYY hh:mm A')}</span></p>
								${
									!args.isPast &&
									`
								<p class="mg-b-0 tx-light"><span class="mg-r-5">Skype ID:</span><span class="tx-medium">${
									event.extendedProps.StudentSkype ?? ''
								}</span></p>
		            				<div class="action mg-t-15">
									<a href="#" data-schedule='${JSON.stringify(
										data,
									)}' class="btn btn-sm btn-info btn-block tx-white-f mg-b-10 join-class-skype" target="_blank" rel="noreferrer"><i class="fab fa-skype"></i> Join class</a>
									${cancelable ? `` : ``}
									${cancelable ? '' : ''}
								</div>
								`
								}

		            `,
					})
					.on('click', function () {
						$(this).popover('show');
					});
			$(document).on('click', function (event) {
				let $el = $(el);
				if (
					!$(event.target).closest($el).length &&
					!$(event.target).closest('.popover').length
				) {
					$el.popover('hide');
				}
			});

			!!$toggleCheckbox && showStudentToggle();
			const events = calendar.getEvents();
			const dayHeaders = document.querySelectorAll('.fc-col-header-cell');
			// console.log({dayHeaders});
			if (dayHeaders.length > 0)
				for (let i = 0; i < dayHeaders.length; i++) {
					//  console.log(dayHeaders[i]);
					if ('data-date' in dayHeaders[i].dataset) continue;
					const date = dayHeaders[i].getAttribute('data-date');
					const dateHD = new Date(date);
					let bookedSlot = 0;
					let totalSlot = 0;
					// console.log({ events });
					events.map((event) => {
						const eventDate = event.start;
						if (eventDate.getTime() === dateHD.getTime()) {
							(event.extendedProps.available === true ||
								event.extendedProps.bookStatus === true) &&
								totalSlot++;
							event.extendedProps.bookStatus === true && bookedSlot++;
						}
					});
					// console.log(dayHeaders[i]);
					// console.log({bookedSlot, totalSlot});
					dayHeaders[i].querySelector('.booked').textContent = bookedSlot;
					dayHeaders[i].querySelector('.total').textContent = totalSlot;
				}
		};

		const eventClick = (args) => {
			const element = args.el;
			const { start, end, id, extendedProps } = args.event;
			if (extendedProps.available) return;
			if (
				!!$toggleCheckbox &&
				$toggleCheckbox.prop('checked') === true &&
				![...element.classList].includes('booked-slot')
			) {
				toast.warning(
					'Please uncheck "Only show student booking hours" before open or booking slot !!',
					{
						position: toast.POSITION.TOP_CENTER,
						autoClose: 5000,
					},
				);
				return;
			}
			if (
				[...element.classList].includes('fc-event-past') ||
				![...element.classList].includes('empty-slot')
			)
				return;
			const diff = getDifferentMinBetweenTime(new Date(), start);
			if (diff < 60) {
				setShowErrorBook(true);
				return;
			}
		};

		calendar = new Calendar(calendarEl, {
			plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
			height: 550,
			expandRows: true,
			slotMinTime: '00:00',
			slotMaxTime: '24:00',

			events: data?.map((y) => ({
				...y,
				id: randomId(),
				loading: true,
			})),

			headerToolbar: {
				start: 'timeGridDay,timeGridWeek,dayGridMonth,listWeek', // will normally be on the left. if RTL, will be on the right
				center: '',
				end: 'today,prev,title,next', // will normally be on the right. if RTL, will be on the left
			},
			titleFormat: { year: 'numeric', month: 'short' },
			navLinks: true, // can click day/week names to navigate views
			editable: true,
			stickyHeaderDates: 'auto',
			selectable: true,
			nowIndicator: true,
			allDaySlot: false,
			dayMaxEvents: true, // allow "more" link when too many events
			eventOverlap: false,
			initialDate: new Date(),
			initialView: 'timeGridWeek',
			firstDay: 1,
			slotDuration: '00:30',
			slotLabelInterval: '00:30',
			slotEventOverlap: false,
			viewDidMount: onViewChange,
			// eventAdd: afterEventAdded,
			selectOverlap: function (event) {
				return event.rendering === 'background';
			},
			select: emptyCellSelect,
			slotLabelContent: function (arg) {
				// console.log('slotLabelContent', arg);

				let templateEl = document.createElement('div');
				templateEl.setAttribute('class', 'slot-label');
				const html = `
								${dayjs(arg.date).format('hh:mm A')}
								`;
				templateEl.innerHTML = html;
				return { html };
			},
			dayHeaderContent: function (args) {
				const days = args.date.getDay();
				const d = args.date.getDate();
				const html = `
										<div class="header-container">
												<div class="date-wrap">
														<span class="hd-date">${d} </span><span class="hd-day">${dayNamesShort[days]}</span>
												</div>
												 <div class="box-slot">
														<span class="booked"></span> <span class="mg-x-2">/</span> <span class="total"></span>
												 </div>
										</div>
								`;
				return { html };
			},
			dayCellDidMount: function (args) {
				// console.log('dayCellDidMount', args);
			},
			slotLabelDidMount: function (args) {
				// console.log('SlotLabelDidMount', args);
			},
			selectAllow: function (selectInfo) {
				if (dayjs(selectInfo.startStr).isBefore(dayjs(new Date())))
					return false;
				return true;
			},
			eventClassNames: function (args) {
				const { event, isPast, isStart } = args;
				const {
					bookInfo,
					eventType,
					bookStatus,
					available,
					isEmptySlot,
					loading,
				} = event.extendedProps;
				let classLists = bookStatus ? 'booked-slot' : 'available-slot';
				classLists += eventType === 1 ? ' hot-slot ' : '';
				classLists += isEmptySlot ? ' empty-slot' : '';
				classLists += loading ? ' is-loading' : '';
				return classLists;
			},
			eventContent: function (args) {
				let templateEl = document.createElement('div');
				const { event, isPast, isStart } = args;
				const {
					bookInfo,
					eventType,
					bookStatus,
					available,
					isEmptySlot,
					loading,
				} = event.extendedProps;
				const data = {
					...event.extendedProps,
					id: event.id,
					start: event.start,
					end: event.end,
					title: event.Title,
				};
				console.log(data);

				const html = `
										${
											!isEmptySlot
												? `
										<div class="inner-book-wrap ">
												<div class="inner-content">
												${
													bookStatus
														? `
																<span class="label-book booked"><i class="fas ${
																	isPast ? 'fa-check' : 'fa-user-graduate'
																}"></i> ${isPast ? 'FINISHED' : 'BOOKED'}  ${
																event.extendedProps.Title
														  }</span>
																`
														: `<span class="label-book"><i class="fas fa-copyright"></i>AVAILABLE</span>`
												}
												${
													available
														? `<a href="javascript:;" class="fix-btn close-schedule" data-schedule='${JSON.stringify(
																data,
														  )}' data-events='${
																calendar.getEventSources().length > 0
																	? calendar.getEventSources()[0]
																			.internalEventSource.meta
																	: {}
														  }'>Close</a>`
														: !bookStatus &&
														  `<a href="javascript:;" class="fix-btn close-schedule" data-schedule='${JSON.stringify(
																data,
														  )}' data-events='${
																calendar.getEventSources().length > 0
																	? calendar.getEventSources()[0]
																			.internalEventSource.meta
																	: {}
														  }'>Close</a>`
												}
																			</div>
																	</div>`
												: ''
										}
								`;
				templateEl.innerHTML = html;
				return { domNodes: [templateEl] };
			},
			eventClick: eventClick,

			eventDidMount: eventDidMount,
			nowIndicatorDidMount: function (args) {
				//   console.log("nowIndicatorDidMount", args);
			},
		});

		calendar.render();
		// console.log('source event', calendar.getEventSources());

		$('body').on('click', '.cancel-schedule', showCancelReasonModal);

		$('body').on('click', '.close-schedule', _closeSlot);

		$('body').on('click', '.join-class-skype', async function (e) {
			e.preventDefault();
			const eventData = JSON.parse(this.getAttribute('data-schedule'));
			try {
				addScheduleLog({ BookingID: eventData.BookingID });
			} catch (error) {
				console.log(error?.message ?? `Can't add schedule log !!`);
			}
			window.location.href = `skype:${eventData?.bookInfo?.SkypeID ?? ''}?chat`;
		});

		// function calendar() {
		// 	// Caching calendar for later use
		// 	const FullCalendar = $('#calendar');

		// 	// Build calendar with default view of mobile query
		// 	FullCalendar({ defaultView: 'timeGridWeek' });

		// 	// Register media query watch handlers
		// 	enquire.register('screen and (max-width: 1023px)', {
		// 		match: () => {
		// 			calendar('changeView', 'timeGridDay');
		// 		},
		// 	});
		// }

		$('body').on(
			'click',
			'#js-book-calendar .fc-next-button',
			triggerNextCalendar,
		);
		$('body').on(
			'click',
			'#js-book-calendar .fc-prev-button',
			triggerPrevCalendar,
		);
		$('body').on(
			'click',
			'#js-book-calendar .fc-today-button',
			triggerTodayCalendar,
		);
		$toggleCheckbox = $('#student-toggle-checkbox');

		$('body').on('change', $toggleCheckbox, showStudentToggle);

		function showStudentToggle() {
			const value = $toggleCheckbox.prop('checked');
			const nonBookedEvents = $('.fc-event:not(.booked-slot)');
			value
				? nonBookedEvents.addClass('hide-event')
				: nonBookedEvents.removeClass('hide-event');
		}
	};

	// ------------ END INIT CALENDAR ---------------

	const _closeSlot = async (event) => {
		try {
			event.preventDefault();
			const closeBtn = event.target;
			const eventId = JSON.parse(closeBtn.getAttribute('data-schedule'));
			const eventInstance = calendar.getEventById(eventId.id);

			const res = await setEventClose({
				OpenID: eventId.OpenID,
			});

			let openDate = dayjs(eventId.start, 'DD/MM/YYYY HH:mm').toDate();

			console.log('event Id:  ', eventId);
			console.log(
				'openDate:  ',
				dayjs(eventId.TeacherStart, 'DD/MM/YYYY HH:mm').toDate(),
			);

			if (res.Code === 200) {
				eventInstance.remove();
				calendar.render();
			} else {
				toast.error('Close slot failed', {
					position: toast.POSITION.TOP_RIGHT,
					autoClose: 2000,
				});
			}
		} catch (error) {
			console.log(error);
		}
	};

	useEffect(() => {
		// getSpaceDate();
		initCalendar();
		console.log(data);
		if (data?.length > 0) {
			const newArr = [...data].map((event, i) => {
				return {
					...event,
					id: i,
					title: event.Title || '',
					start: dayjs(event.StartDate, 'DD/MM/YYYY HH:mm').toDate(),
					end: dayjs(event.EndDate, 'DD/MM/YYYY HH:mm').toDate(),
					eventType: event.eventType,
					bookStatus: event.BookingStatus,
					bookInfo: event.bookInfo,
					available: event.available,
					isEmptySlot: event.isEmptySlot,
					loading: false,
				};
			});

			calendar.addEventSource(newArr);
		}

		lottie &&
			lottie.loadAnimation({
				container: loadingRef.current, // the dom element that will contain the animation
				renderer: 'svg',
				loop: true,
				autoplay: true,
				path: '/static/img/loading.json', // the path to the animation json
			});

		return () => {
			loadingRef.current = false;
		};
	}, []);

	return (
		<>
			<div className="pos-relative">
				<>
					{isLoading && (
						<div className="loading-style">
							<div ref={loadingRef} className="lottie-loading"></div>
						</div>
					)}
				</>
				<div id="js-book-calendar" className="fc fc-unthemed fc-ltr"></div>

				<Modal
					show={showErrorBook}
					onHide={() => setShowErrorBook(false)}
					size="sm"
					centered
					bsPrefix="modal"
				>
					<Modal.Header bsPrefix="modal-header bg-danger tx-white pd-10">
						<Modal.Title bsPrefix="modal-title tx-white">
							Open slot failed !
						</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<p className="mg-b-0">
							Sorry, you cannot open this class. It is less than 60 mins to
							starting time.
						</p>
						<div className="tx-right mg-t-15">
							<Button
								size="sm"
								variant="light"
								onClick={() => setShowErrorBook(false)}
							>
								Close
							</Button>
						</div>
					</Modal.Body>
				</Modal>
				{/* <CancelSlotModal
					showModal={showCancelModal}
					closeModal={() => setShowCancelModal(false)}
					handleCancelSlot={_cancelSlot}
					loading={cancelLoading}
				/> */}
				<ActiveSlotModal
					data={{
						start: dayjs(modalData?.start).format('DD/MM/YYYY HH:mm') ?? '',
						end: dayjs(modalData?.end).format('DD/MM/YYYY HH:mm') ?? '',
					}}
					showModal={showActiveModal}
					closeModal={() => setShowActiveModal(false)}
					handleOpenSlot={_openSlot}
				/>
			</div>
		</>
	);
};

export default FullCalendar;
