import { Badge, Button, Card } from "react-bootstrap";
import { IAttachment } from "../../types/order";
import classNames from "classnames";
import pdfImage from "../pdf-file.png";
import { Link } from "react-router-dom";
import { Status } from "../../enums/order";


interface MediaComponentProps {
  media: IAttachment;
  handleStatus: (_id: string | number | null, _status: string | null) => void
}

const Attachment: React.FC<MediaComponentProps> = ({ media, handleStatus }) => {
  const labelClass = classNames("", {
    "success": media.status === Status.DESIGN_APPROVED || media.status === Status.READY_FOR_PRODUCTION,
    "info": media.status === Status.WAITING_FOR_APPROVAL || media.status === Status.REVISION_REQUESTED,
    "danger": media.status === Status.REJECTED
  });

  return (
    <div className="d-flex align-items-start mb-3 border">
      <div className="p-2">
        <Link to={media.url} target="_blank">
          {media.ext === "pdf" ? (<Card.Img variant="top" src={pdfImage} width={100} height={180} />) : (<Card.Img variant="top" src={media.url} width={100} height={180} />)}
        </Link>
      </div>
      <div className="p-2">
        <h4>{media.name}</h4>
        <p className="mb-1">
          <strong>Status: </strong><Badge bg={labelClass} className="rounded-0">{media.status}</Badge><br />
        </p>
        {media.comment && (
          <p className="mb-1">{media.comment}</p>
        )}
        <Link to={media.url} target="_blank" className="btn btn-sm btn-primary rounded-0">Download</Link>
        {media.status === Status.WAITING_FOR_APPROVAL && (
          <>
            <Button variant="success" onClick={(_e) => handleStatus(media.id, "Accept")} size="sm" className="rounded-0">Click Here To Approve</Button>
            <Button variant="danger" onClick={(_e) => handleStatus(media.id, "Revision")} size="sm" className="rounded-0">Ask For Revision(Wait Time 3-5 Days)</Button>
          </>
        )}
      </div>
    </div>
  );


  // return (
  //   <Card style={{ width: '12rem' }} className="attachment float-left">
  //     <Link to={media.url} target="_blank">
  //       {media.ext === "pdf" ? (<Card.Img variant="top" src={pdfImage} width={100} height={180} />) : (<Card.Img variant="top" src={media.url} width={100} height={180} />)}
  //     </Link>
  //     <Card.Body>
  //       <Card.Title>{media.name}</Card.Title>
  //       <Card.Text>
  //         <p><strong>Status:</strong> <Badge bg={labelClass} className="rounded-0">{media.status}</Badge></p>
  //         <p><small>Updated On: {new Date(media.updated).toLocaleString()}</small></p>
  //       </Card.Text>
  //       {media.status === Status.WAITING_FOR_APPROVAL && (
  //         <>
  //           <Button variant="success" onClick={(_e) => handleStatus("Accepted")} size="sm" className="rounded-0">Accept</Button>
  //           <Button variant="danger" onClick={(_e) => handleStatus("Rejected")} size="sm" className="rounded-0">Reject</Button>
  //         </>
  //       )}
  //     </Card.Body>
  //   </Card>
  // );
};

export default Attachment;