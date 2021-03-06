import React, { useState, useEffect, useReducer } from 'react';
import Pagination from 'react-js-pagination';
import { GetTimeLimiteCourses } from '~/api/studentAPI';
// import { convertDateFromTo, randomId } from '~/utils';
import Skeleton from 'react-loading-skeleton';
// import './index.module.scss';
import { appSettings } from '~/config';
import { getStudentLayout } from '~/components/Layout';
import 'react-datepicker/dist/react-datepicker.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { i18n, withTranslation } from '~/i18n';

let start = '',
	end = '';

const LessonItem = ({
	PackageName,
	CourseName,
	StartDate,
	EndDate,
	BookingID,
	DocumentID,
	DocumentDetailID,
	DocumentName,
	LessionName,
	LessonDetail,
	start,
	end,
	date,
	TeacherUID,
	TeacherName,
	Status,
	StatusString,
}) => {
	return (
		<tr>
			<td style={{ letterSpacing: '0.5px' }}>{PackageName}</td>
			<td>{CourseName}</td>
			<td style={{ whiteSpace: 'pre-line' }}>{StartDate}</td>
			<td>{EndDate}</td>
		</tr>
	);
};

const CourseDuration = ({ t }) => {
	const [data, setData] = useState({});
	const [fromDate, setFromDate] = useState(null);
	const [toDate, setToDate] = useState(null);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(0);
	const [totalResult, setTotalResult] = useState(0);
	const [loading, setLoading] = useState(true);

	const getAPI = async (params) => {
		setLoading(true);
		const res = await GetTimeLimiteCourses(params);
		if (res.Code === 200) {
			setData(res.Data);
			setLoading(true);
			setPageSize(res.PageSize);
			setTotalResult(res.TotalResult);
		} else {
			setData({});
		}
		setLoading(false);
	};

	const handlePageChange = (pageNumber) => {
		if (page !== pageNumber) {
			setPage(pageNumber);
			getAPI({
				FromDate: fromDate,
				ToDate: toDate,
				Page: pageNumber,
			});
		}
	};

	const onSubmit = (e) => {
		e.preventDefault();
		getAPI({
			FromDate: fromDate,
			ToDate: toDate,
			Page: 1,
		});
		setPage(1);
		start = fromDate;
		end = toDate;
	};

	useEffect(() => {
		let UID = null;
		let Token = null;

		// GET UID and Token
		if (localStorage.getItem('UID')) {
			UID = localStorage.getItem('UID');
			Token = localStorage.getItem('token');
		}
		getAPI({
			UID: UID,
			Page: 1,
			Token: Token,
		});
	}, []);
	return (
		console.log('render'),
		(
			<>
				<h1 className="main-title-page">{t('course-duration')}</h1>
				<div className="card">
					<div className="card-body">
						<div className="table-responsive mg-t-20">
							<table className="table">
								<thead className="">
									<tr>
										<th>{t('package')}</th>
										<th>{t('course')}</th>
										<th>{t('start-day')}</th>
										<th>{t('end-day')}</th>
									</tr>
								</thead>
								<tbody>
									{loading ? (
										<>
											<tr>
												<td>
													<Skeleton />
												</td>
												<td>
													<Skeleton />
												</td>
												<td>
													<Skeleton />
												</td>
												<td>
													<Skeleton />
												</td>
											</tr>
											<tr>
												<td>
													<Skeleton />
												</td>
												<td>
													<Skeleton />
												</td>
												<td>
													<Skeleton />
												</td>
												<td>
													<Skeleton />
												</td>
											</tr>
											<tr>
												<td>
													<Skeleton />
												</td>
												<td>
													<Skeleton />
												</td>
												<td>
													<Skeleton />
												</td>
												<td>
													<Skeleton />
												</td>
											</tr>
										</>
									) : !!data && Array.isArray(data) && data.length > 0 ? (
										data.map((item) => (
											<LessonItem
												key={item.BookingID}
												BookingID={item.BookingID}
												DocumentID={item.DocumentID}
												CourseName={item.CourseName}
												DocumentName={item.CourseName}
												DocumentDetailID={item.DocumentDetailID}
												LessionName={item.DocumentName}
												PackageName={item.PackageName}
												StartDate={item.StartDate}
												EndDate={item.EndDate}
												// start={convertDateFromTo(item.Schedule).fromTime}
												// end={convertDateFromTo(item.Schedule).endTime}
												date={item.PaymentDate}
												TeacherUID={item.TeacherUID}
												TeacherName={item.PayerName}
												Status={item.Status}
												StatusString={item.StatusString}
											/>
										))
									) : data.length === 0 ? (
										<tr className="bg-transparent">
											<td colSpan="6" className="tx-center">
												<img
													src="/static/img/no-data.svg"
													alt="no-booking"
													className="wd-200 d-block mx-auto"
												/>
												<p className="tx-danger tx-medium mg-t-15">
													{start.length > 0 && end.length > 0
														? `B???n ch??a ????ng k?? l???p h???c n??o t??? ${
																start.length > 0 ? `${start}` : ''
														  }  ${end.length > 0 ? `?????n ${end}` : ''}`
														: start.length === 0 && end.length === 0
														? `B???n ch??a ????ng k?? l???p h???c n??o`
														: start.length === 0
														? `B???n ch??a ????ng k?? l???p h???c n??o tr?????c ${end}`
														: `B???n ch??a ????ng k?? l???p h???c n??o sau ${start}`}
												</p>
												<Link href="/student/booking-schedule">
													<a href={true} className="btn btn-primary">
														?????t l???ch h???c
													</a>
												</Link>
											</td>
										</tr>
									) : (
										!loading && (
											<tr className="bg-transparent">
												<td colSpan="6" className="tx-center">
													<span className="d-block text-center tx-danger tx-medium">
														???? c?? l???i x???y ra, xin vui l??ng th??? l???i
													</span>
													<img
														src="/static/assets/img/error.svg"
														alt="error"
														className="wd-200 mg-b-15"
													/>
												</td>
											</tr>
										)
									)}
								</tbody>
							</table>
						</div>
						{pageSize < totalResult && (
							<Pagination
								innerClass="pagination justify-content-end mt-3"
								activePage={page}
								itemsCountPerPage={pageSize}
								totalItemsCount={totalResult}
								pageRangeDisplayed={3}
								itemClass="page-item"
								linkClass="page-link"
								onChange={handlePageChange.bind(this)}
							/>
						)}
					</div>
				</div>
			</>
		)
	);
};

// EvaluationLists.getLayout = getStudentLayout;

// export default EvaluationLists;

CourseDuration.getLayout = getStudentLayout;
CourseDuration.getInitialProps = async () => ({
	namespacesRequired: ['common'],
});

export default withTranslation('common')(CourseDuration);
