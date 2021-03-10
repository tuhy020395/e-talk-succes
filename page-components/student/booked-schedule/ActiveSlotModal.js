import React, { useEffect } from 'react';
import { Modal } from 'react-bootstrap';
const ActiveSlotModal = ({
	data,
	handleOpenSlot,
	showModal = false,
	closeModal,
	openModal,
}) => {
	const { date = '', start = '', end = '' } = data;
	const [onSending, sOnSending] = React.useState(false);

	useEffect(() => {
		onSending && handleOpenSlot();
	}, [onSending]);

	return (
		<>
			<Modal
				show={showModal}
				// backdrop="static"   //Prevent close when click overlay
				keyboard={false}
				centered
				animation={false}
				onHide={closeModal}
			>
				<Modal.Header closeButton>
					<Modal.Title>Confirm active</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<p>Do you want open slot from:</p>
					<div className="row">
						<div className="col">
							<p>
								Start:{' '}
								<span className="tx-medium" id="js-start-time">
									{start}
								</span>
							</p>
						</div>
						<div className="col">
							<p>
								End:{' '}
								<span className="tx-medium" id="js-end-time">
									{end}
								</span>
							</p>
						</div>
					</div>
				</Modal.Body>
				<Modal.Footer>
					<button
						type="button"
						disabled={onSending}
						className="btn btn-light btn-sm"
						onClick={closeModal}
					>
						Close
					</button>
					<button
						type="button"
						disabled={onSending}
						className="btn btn-primary btn-sm tx-primary"
						onClick={() => sOnSending(true)}
					>
						{onSending ? (
							<span>
								<i class="fas fa-spinner fa-spin"></i> Open slot
							</span>
						) : (
							<span>Open slot</span>
						)}
					</button>
				</Modal.Footer>
			</Modal>
		</>
	);
};

export default ActiveSlotModal;
